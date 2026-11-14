
import { Types } from "mongoose";

import { Post } from "./posts.model";
import { User } from "../users/users.model";

import type {
    AllPostsResult,
    CreatePostInput,
    PostPaginationInput,
    PublicPost,
    UserPostsAggregationResult,
} from "./posts.types";

import { AppError } from "../../shared/errors/app-error";

const toPublicPost = (post: {
    _id: unknown;
    user: unknown;
    title: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}): PublicPost => ({
    id: String(post._id),
    userId: String(post.user),
    title: post.title,
    content: post.content,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
});

const createPost = async (
    userId: string,
    input: CreatePostInput
): Promise<PublicPost> => {
    const post = await Post.create({
        user: userId,
        title: input.title,
        content: input.content,
    });

    return toPublicPost(post);
};

const getPostsByUser = async (
    userId: string,
    pagination: PostPaginationInput
) => {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const results = await User.aggregate<UserPostsAggregationResult>([
        {
            $match: {
                _id: new Types.ObjectId(userId),
            },
        },
        {
            $lookup: {
                from: Post.collection.name,
                localField: "_id",
                foreignField: "user",
                pipeline: [
                    {
                        $sort: {
                            createdAt: -1,
                            _id: -1,
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            user: 1,
                            title: 1,
                            content: 1,
                            createdAt: 1,
                            updatedAt: 1,
                        },
                    },
                    {
                        $facet: {
                            data: [
                                { $skip: skip },
                                { $limit: limit },
                            ],
                            metadata: [
                                { $count: "totalPosts" },
                            ],
                        },
                    },
                ],
                as: "postResult",
            },
        },
        {
            $unwind: "$postResult",
        },
        {
            $project: {
                _id: 1,
                name: 1,
                posts: "$postResult.data",
                totalPosts: {
                    $ifNull: [
                        {
                            $arrayElemAt: [
                                "$postResult.metadata.totalPosts",
                                0,
                            ],
                        },
                        0,
                    ],
                },
            },
        },
    ]);

    const result = results[0];

    if (!result) {
        throw new AppError(
            "User not found",
            404,
            "USER_NOT_FOUND"
        );
    }

    return {
        user: {
            id: String(result._id),
            name: result.name,
        },
        posts: result.posts.map((p) => ({
            ...toPublicPost(p),
            authorName: result.name,
        })),
        pagination: {
            page,
            limit,
            totalPosts: result.totalPosts,
            totalPages: Math.ceil(result.totalPosts / limit),
        },
    };
};

const getAllPosts = async (
    pagination: PostPaginationInput
): Promise<AllPostsResult> => {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [posts, totalPosts] = await Promise.all([
        Post.find()
            .populate<{ user: { _id: Types.ObjectId; name: string } }>(
                "user",
                "name"
            )
            .sort({ createdAt: -1, _id: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Post.countDocuments(),
    ]);

    return {
        posts: posts.map((post) => ({
            id: String(post._id),
            userId: post.user && typeof post.user === "object" ? String(post.user._id) : String(post.user),
            authorName: post.user && typeof post.user === "object" ? post.user.name : "Anonymous",
            title: post.title,
            content: post.content,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
        })),
        pagination: {
            page,
            limit,
            totalPosts,
            totalPages: Math.ceil(totalPosts / limit),
        },
    };
};

export const postsService = {
    createPost,
    getPostsByUser,
    getAllPosts,
};
