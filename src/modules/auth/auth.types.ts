import { PublicUser, UserRole } from "../users/users.types";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  interests?: string[];
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
}

export interface AuthResponse {
  user: PublicUser;
  accessToken: string;
}
