export type UserRole = "user" | "admin";

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  interests: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  interests: string[];
}
