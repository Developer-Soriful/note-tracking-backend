import type { RequestHandler } from "express";
import type { LoginInput, RegisterInput } from "./auth.types";
import { authService } from "./auth.service";

const register: RequestHandler = async (req, res) => {
  const result = await authService.register(req.body as RegisterInput);

  res.status(201).json({
    success: true,
    message: "Registration successful",
    data: result,
  });
};

const login: RequestHandler = async (req, res) => {
  const result = await authService.login(req.body as LoginInput);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: result,
  });
};

export const authController = {
  register,
  login,
};
