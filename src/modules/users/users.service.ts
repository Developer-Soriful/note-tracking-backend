import bcrypt from "bcryptjs";

import { AppError } from "../../shared/errors/app-error";
import { PublicUser, UserRole } from "./users.types";
import { User } from "./users.model";

const SALT_ROUNDS = 12;

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  interests?: string[];
}

interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  interests?: string[];
}

interface PaginationInput {
  page: number;
  limit: number;
}

const toPublicUser = (user: {
  _id: unknown;
  name: string;
  email: string;
  role: UserRole;
  interests: string[];
}): PublicUser => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
  interests: user.interests,
});

const getMyProfile = async (userId: string): Promise<PublicUser> => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  return toPublicUser(user);
};

const getAllUsers = async (pagination: PaginationInput) => {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const [users, totalUsers] = await Promise.all([
    User.find().sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),

    User.countDocuments(),
  ]);

  return {
    users: users.map(toPublicUser),
    pagination: {
      page,
      limit,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
    },
  };
};

const createUser = async (input: CreateUserInput): Promise<PublicUser> => {
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

  return toPublicUser(user);
};

const updateUser = async (
  userId: string,
  input: UpdateUserInput,
  requesterId: string,
): Promise<PublicUser> => {
  if (userId === requesterId && input.role !== undefined) {
    throw new AppError(
      "You cannot change your own role",
      403,
      "SELF_ROLE_CHANGE_FORBIDDEN",
    );
  }

  const updateData: Record<string, unknown> = {
    ...input,
  };

  if (input.password) {
    updateData.password = await bcrypt.hash(input.password, SALT_ROUNDS);
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  return toPublicUser(user);
};

const deleteUser = async (
  userId: string,
  requesterId: string,
): Promise<void> => {
  if (userId === requesterId) {
    throw new AppError(
      "You cannot delete your own account",
      403,
      "SELF_DELETION_FORBIDDEN",
    );
  }

  const user = await User.findByIdAndDelete(userId);

  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }
};

export const usersService = {
  getMyProfile,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
};
