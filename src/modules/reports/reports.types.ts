import type { UserRole } from "../users/users.types";

export interface ReportPaginationInput {
  page: number;
  limit: number;
}

export interface GroupedUserSummary {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface InterestReportItem {
  interest: string;
  totalUsers: number;
  users: GroupedUserSummary[];
}

export interface UsersByInterestResult {
  reports: InterestReportItem[];
  pagination: {
    page: number;
    limit: number;
    totalInterests: number;
    totalPages: number;
  };
}

