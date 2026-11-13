import { Router } from "express";

import { usersController } from "./users.controller";
import { createUserSchema, updateUserSchema } from "./users.validation";

import {
  authenticate,
  authorize,
} from "../../shared/middleware/auth.middleware";

import { validateBody } from "../../shared/middleware/validate.middleware";

const router = Router();

// All routes require authentication.
router.use(authenticate);

// Authenticated user can view their own profile.
router.get("/me", usersController.getMyProfile);

// Admin-only user management routes.
router.get("/", authorize("admin"), usersController.getAllUsers);

router.post(
  "/",
  authorize("admin"),
  validateBody(createUserSchema),
  usersController.createUser,
);

router.patch(
  "/:userId",
  authorize("admin"),
  validateBody(updateUserSchema),
  usersController.updateUser,
);

router.delete("/:userId", authorize("admin"), usersController.deleteUser);

export default router;
