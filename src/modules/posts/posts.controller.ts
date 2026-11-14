
import type { Request, RequestHandler } from "express";

import { AppError } from "../../shared/errors/app-error";
import type { AuthenticatedUser } from "../auth/auth.types";

import { postsService } from "./posts.service";
import {
    postPaginationSchema,
    postUserIdSchema,
} from "./posts.validation";

import type { CreatePostInput } from "./posts.types";

const getRequester = (req: Request): AuthenticatedUser => {
    if (!req.user) {
        throw new AppError(
            "Authentication required",
            401,
            "UNAUTHORIZED"
        );
    }

    return req.user;
};

const createPost: RequestHandler = async (req, res) => {
    const requester = getRequester(req);

    const post = await postsService.createPost(
        requester.id,
        req.body as CreatePostInput
    );

    res.status(201).json({
        success: true,
        message: "Post created successfully",
        data: post,
    });
};

const getPostsByUser: RequestHandler = async (req, res) => {
    const userIdResult = postUserIdSchema.safeParse(
        req.params.userId
    );

    if (!userIdResult.success) {
        throw new AppError(
            "Invalid user ID",
            400,
            "INVALID_USER_ID"
        );
    }

    const paginationResult = postPaginationSchema.safeParse(
        req.query
    );

    if (!paginationResult.success) {
        throw new AppError(
            "Invalid pagination parameters",
            400,
            "VALIDATION_ERROR",
            paginationResult.error.issues
        );
    }

    const result = await postsService.getPostsByUser(
        userIdResult.data,
        paginationResult.data
    );

    res.status(200).json({
        success: true,
        message: "User posts retrieved successfully",
        data: result,
    });
};

const getAllPosts: RequestHandler = async (req, res) => {
    const paginationResult = postPaginationSchema.safeParse(req.query);

    if (!paginationResult.success) {
        throw new AppError(
            "Invalid pagination parameters",
            400,
            "VALIDATION_ERROR",
            paginationResult.error.issues
        );
    }

    const result = await postsService.getAllPosts(paginationResult.data);

    res.status(200).json({
        success: true,
        message: "Posts retrieved successfully",
        data: result,
    });
};

export const postsController = {
    getAllPosts,
    createPost,
    getPostsByUser,
};
