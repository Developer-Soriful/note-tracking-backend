import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";

import { env } from "../../config/env";
import { AppError } from "../errors/app-error";
import { UserRole } from "../../modules/users/users.types";

const isUserRole = (value: unknown): value is UserRole => {
  return value === "user" || value === "admin";
};

/**
 * Verifies the JWT access token and attaches
 * the authenticated user's identity to the request.
 */
export const authenticate: RequestHandler = (req, _res, next) => {
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

  try {
    const decoded = jwt.verify(match[1], env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    if (
      typeof decoded === "string" ||
      typeof decoded.sub !== "string" ||
      !isUserRole(decoded.role)
    ) {
      throw new Error("Invalid token payload");
    }

    req.user = {
      id: decoded.sub,
      role: decoded.role,
    };

    next();
  } catch {
    next(new AppError("Invalid or expired access token", 401, "INVALID_TOKEN"));
  }
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
