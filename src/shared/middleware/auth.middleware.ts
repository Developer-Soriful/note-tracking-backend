import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";

import { env } from "../../config/env";
import { AppError } from "../errors/app-error";
import { UserRole } from "../../modules/users/users.types";
import { User } from "../../modules/users/users.model";

const isUserRole = (value: unknown): value is UserRole => {
  return value === "user" || value === "admin";
};

/**
 * Verifies the JWT access token and authenticates the user's current
 * identity and role against MongoDB as the authoritative source.
 */
export const authenticate: RequestHandler = async (req, _res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    next(new AppError("Authentication required", 401, "UNAUTHORIZED"));
    return;
  }

  const match = /^Bearer\s+(.+)$/i.exec(authorization);

  if (!match?.[1]) {
    next(new AppError("Invalid authorization header", 401, "INVALID_TOKEN"));
    return;
  }

  let userId: string;

  try {
    const rawDecoded = jwt.verify(match[1], env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    if (
      typeof rawDecoded === "string" ||
      typeof rawDecoded.sub !== "string"
    ) {
      next(new AppError("Invalid token payload", 401, "INVALID_TOKEN"));
      return;
    }

    userId = rawDecoded.sub;
  } catch {
    next(new AppError("Invalid or expired access token", 401, "INVALID_TOKEN"));
    return;
  }

  // Validate that sub matches standard 24-hex ObjectId format
  if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
    next(new AppError("Invalid user identifier in token", 401, "INVALID_TOKEN"));
    return;
  }

  // Authoritative identity check: Load the user from MongoDB
  const user = await User.findById(userId).select("_id role").lean();

  if (!user) {
    next(
      new AppError(
        "User account not found or no longer active",
        401,
        "UNAUTHORIZED",
      ),
    );
    return;
  }

  if (!isUserRole(user.role)) {
    next(new AppError("Invalid user role assigned", 403, "FORBIDDEN"));
    return;
  }

  req.user = {
    id: String(user._id),
    role: user.role,
  };

  next();
};

/**
 * Checks whether the authenticated user has
 * permission to access a specific resource.
 */
export const authorize = (...allowedRoles: UserRole[]): RequestHandler => {
  return (req, _res, next) => {
    if (!req.user) {
      next(new AppError("Authentication required", 401, "UNAUTHORIZED"));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError("Access denied", 403, "FORBIDDEN"));
      return;
    }

    next();
  };
};
