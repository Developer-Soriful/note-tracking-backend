import type { RequestHandler } from "express";

import { AppError } from "../../shared/errors/app-error";
import { usersService } from "./users.service";
import { paginationSchema, userIdSchema } from "./users.validation";

const getRequesterId = (req: Parameters<RequestHandler>[0]): string => {
  if (!req.user) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }

  return req.user.id;
};

const getMyProfile: RequestHandler = async (req, res) => {
  const userId = getRequesterId(req);

  const user = await usersService.getMyProfile(userId);

  res.status(200).json({
    success: true,
    message: "Profile retrieved successfully",
    data: user,
  });
};

const getAllUsers: RequestHandler = async (req, res) => {
  const paginationResult = paginationSchema.safeParse(req.query);

  if (!paginationResult.success) {
    throw new AppError(
      "Invalid pagination parameters",
      400,
      "VALIDATION_ERROR",
      paginationResult.error.issues,
    );
  }

  const result = await usersService.getAllUsers(paginationResult.data);

  res.status(200).json({
    success: true,
    message: "Users retrieved successfully",
    data: result,
  });
};

const createUser: RequestHandler = async (req, res) => {
  const user = await usersService.createUser(req.body);

  res.status(201).json({
    success: true,
    message: "User created successfully",
    data: user,
  });
};

const updateUser: RequestHandler = async (req, res) => {
  const idResult = userIdSchema.safeParse(req.params.userId);

  if (!idResult.success) {
    throw new AppError("Invalid user ID", 400, "INVALID_USER_ID");
  }

  const requesterId = getRequesterId(req);

  const user = await usersService.updateUser(
    idResult.data,
    req.body,
    requesterId,
  );

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: user,
  });
};

const deleteUser: RequestHandler = async (req, res) => {
  const idResult = userIdSchema.safeParse(req.params.userId);

  if (!idResult.success) {
    throw new AppError("Invalid user ID", 400, "INVALID_USER_ID");
  }

  const requesterId = getRequesterId(req);

  await usersService.deleteUser(idResult.data, requesterId);

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
};

export const usersController = {
  getMyProfile,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
};
