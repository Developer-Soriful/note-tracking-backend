import type { ErrorRequestHandler } from "express";

import { AppError } from "../errors/app-error";
import { env } from "../../config/env";

/**
 * Detects MongoDB duplicate key errors.
 * MongoDB error code 11000 indicates a duplicate key.
 */
const isDuplicateKeyError = (error: unknown): boolean => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
};

export const errorMiddleware: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  next,
) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const isOperational = error instanceof AppError;
  const isDuplicate = isDuplicateKeyError(error);

  const statusCode = isDuplicate ? 409 : isOperational ? error.statusCode : 500;

  const message = isDuplicate
    ? "Email is already registered"
    : isOperational
      ? error.message
      : "Internal server error";

  const code = isDuplicate
    ? "DUPLICATE_RESOURCE"
    : isOperational
      ? error.code
      : "INTERNAL_SERVER_ERROR";

  if (!isOperational && !isDuplicate) {
    console.error("Unexpected application error:", error);
  }

  res.status(statusCode).json({
    success: false,
    message,
    code,

    ...(isOperational && error.details !== undefined
      ? { details: error.details }
      : {}),

    ...(env.NODE_ENV === "development" && error instanceof Error
      ? { debugMessage: error.message }
      : {}),
  });
};
