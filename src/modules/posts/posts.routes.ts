
import { Router } from "express";

import { postsController } from "./posts.controller";
import { createPostSchema } from "./posts.validation";

import { authenticate } from "../../shared/middleware/auth.middleware";
import { validateBody } from "../../shared/middleware/validate.middleware";

const router = Router();

router.get(
    "/",
    postsController.getAllPosts
);

router.post(
    "/",
    authenticate,
    validateBody(createPostSchema),
    postsController.createPost
);

router.get(
    "/user/:userId",
    postsController.getPostsByUser
);

export default router;
