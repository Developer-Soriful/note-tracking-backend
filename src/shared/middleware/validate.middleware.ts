import type { RequestHandler } from "express";
import { z } from "zod";
import { AppError } from "../errors/app-error";

export const validateBody = (schema: z.ZodType): RequestHandler => {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      next(
        new AppError(
          "Request validation failed",
          400,
          "VALIDATION_ERROR",
          result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        ),
      );

      return;
    }

    req.body = result.data;
    next();
  };
};
