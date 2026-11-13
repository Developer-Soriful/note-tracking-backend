import { Router } from "express";
import rateLimit from "express-rate-limit";

import { authController } from "./auth.controller";
import { loginSchema, registerSchema } from "./auth.validation";

import { validateBody } from "../../shared/middleware/validate.middleware";

const router = Router();

const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many registration attempts. Please try again later.",
    code: "RATE_LIMITED",
  },
});

const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
    code: "RATE_LIMITED",
  },
});

router.post(
  "/register",
  registerRateLimit,
  validateBody(registerSchema),
  authController.register,
);

router.post(
  "/login",
  loginRateLimit,
  validateBody(loginSchema),
  authController.login,
);

export default router;
