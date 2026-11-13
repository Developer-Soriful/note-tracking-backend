import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import type { AuthResponse, LoginInput, RegisterInput } from "./auth.types";

import { AppError } from "../../shared/errors/app-error";
import { env } from "../../config/env";
import { PublicUser } from "../users/users.types";
import { User } from "../users/users.model";

const SALT_ROUNDS = 12;

const createAccessToken = (userId: string, role: "user" | "admin"): string => {
  return jwt.sign(
    {
      sub: userId,
      role,
    },
    env.JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: "15m",
    },
  );
};

const toPublicUser = (user: {
  _id: unknown;
  name: string;
  email: string;
  role: "user" | "admin";
  interests: string[];
}): PublicUser => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
  interests: user.interests,
});

const register = async (input: RegisterInput): Promise<AuthResponse> => {
  const existingUser = await User.exists({
    email: input.email,
  });

  if (existingUser) {
    throw new AppError(
      "Email is already registered",
      409,
      "EMAIL_ALREADY_EXISTS",
    );
  }

  const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await User.create({
    name: input.name,
    email: input.email,
    password: hashedPassword,
    interests: input.interests ?? [],
    role: "user",
  });

  const publicUser = toPublicUser(user);

  return {
    user: publicUser,
    accessToken: createAccessToken(publicUser.id, publicUser.role),
  };
};

const login = async (input: LoginInput): Promise<AuthResponse> => {
  const user = await User.findOne({
    email: input.email,
  }).select("+password");

  if (!user) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.password);

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  const publicUser = toPublicUser(user);

  return {
    user: publicUser,
    accessToken: createAccessToken(publicUser.id, publicUser.role),
  };
};

export const authService = {
  register,
  login,
};
