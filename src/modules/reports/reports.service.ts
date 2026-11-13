import { User } from "../users/users.model";
import type {
  ReportPaginationInput,
  UsersByInterestResult,
} from "./reports.types";

const getUsersByInterest = async (
  pagination: ReportPaginationInput,
): Promise<UsersByInterestResult> => {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const results = await User.aggregate<{
    data: Array<{
      interest: string;
      totalUsers: number;
      users: Array<{
        id: string;
        name: string;
        email: string;
        role: "user" | "admin";
      }>;
    }>;
    metadata: Array<{ total: number }>;
  }>([
    {
      $match: {
        "interests.0": { $exists: true },
      },
    },
    {
      $unwind: "$interests",
    },
    {
      $group: {
        _id: "$interests",
        totalUsers: { $sum: 1 },
        users: {
          $push: {
            id: { $toString: "$_id" },
            name: "$name",
            email: "$email",
            role: "$role",
          },
        },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 0,
              interest: "$_id",
              totalUsers: 1,
              users: 1,
            },
          },
        ],
        metadata: [{ $count: "total" }],
      },
    },
  ]);

  const facetResult = results[0];
  const reports = facetResult?.data ?? [];
  const totalInterests = facetResult?.metadata?.[0]?.total ?? 0;
  const totalPages =
    totalInterests === 0 ? 0 : Math.ceil(totalInterests / limit);

  return {
    reports,
    pagination: {
      page,
      limit,
      totalInterests,
      totalPages,
    },
  };
};

export const reportsService = {
  getUsersByInterest,
};

