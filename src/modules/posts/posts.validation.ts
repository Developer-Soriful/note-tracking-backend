
import { z } from "zod";

export const createPostSchema = z.object({
    title: z.string().trim().min(1).max(200),
    content: z.string().trim().min(1).max(20_000),
});

export const postPaginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const postUserIdSchema = z.string().regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid user ID"
);
