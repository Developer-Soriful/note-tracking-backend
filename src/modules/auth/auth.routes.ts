import { Router } from "express";

import { authController } from "./auth.controller";
import { loginSchema, registerSchema } from "./auth.validation";

import { validateBody } from "../../shared/middleware/validate.middleware";

const router = Router();

router.post("/register", validateBody(registerSchema), authController.register);

router.post("/login", validateBody(loginSchema), authController.login);

export default router;
