
import type { Types } from "mongoose";

export interface IPost {
    user: Types.ObjectId;
    title: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreatePostInput {
    title: string;
    content: string;
}

export interface PostPaginationInput {
    page: number;
    limit: number;
}

export interface PublicPost {
    id: string;
    userId: string;
    title: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserPostsAggregationResult {
    _id: Types.ObjectId;
    name: string;
    posts: Array<{
        _id: Types.ObjectId;
        user: Types.ObjectId;
        title: string;
        content: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    totalPosts: number;
}
