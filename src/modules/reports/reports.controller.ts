import type { RequestHandler } from "express";

import { AppError } from "../../shared/errors/app-error";
import { reportsService } from "./reports.service";
import { reportPaginationSchema } from "./reports.validation";

const getUsersByInterest: RequestHandler = async (req, res) => {
  const paginationResult = reportPaginationSchema.safeParse(req.query);

  if (!paginationResult.success) {
    throw new AppError(
      "Invalid pagination parameters",
      400,
      "VALIDATION_ERROR",
      paginationResult.error.issues,
    );
  }

  const result = await reportsService.getUsersByInterest(paginationResult.data);

  res.status(200).json({
    success: true,
    message: "Users grouped by interest retrieved successfully",
    data: result,
  });
};

export const reportsController = {
  getUsersByInterest,
};

