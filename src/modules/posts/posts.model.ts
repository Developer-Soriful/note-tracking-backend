
import { Schema, model } from "mongoose";

import type { IPost } from "./posts.types";

const postSchema = new Schema<IPost>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
            maxlength: 200,
        },
        content: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
            maxlength: 20_000,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Supports the $lookup equality match on user and stable post ordering.
postSchema.index({
    user: 1,
    createdAt: -1,
    _id: -1,
});

export const Post = model<IPost>("Post", postSchema);
