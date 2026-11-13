import "dotenv/config";

import bcrypt from "bcryptjs";
import { z } from "zod";

import {
  connectDatabase,
  disconnectDatabase,
} from "../database/connection";
import { User } from "../modules/users/users.model";
import { safeErrorMessage } from "../shared/utils/safe-error-message";

const adminEnvSchema = z.object({
  ADMIN_NAME: z.string().trim().min(2).max(100),
  ADMIN_EMAIL: z
    .email()
    .max(254)
    .transform((value) => value.trim().toLowerCase()),
  ADMIN_PASSWORD: z
    .string()
    .min(8)
    .refine(
      (value) => Buffer.byteLength(value, "utf8") <= 72,
      "Admin password must not exceed 72 UTF-8 bytes",
    ),
});

const SALT_ROUNDS = 12;

const seedAdmin = async (): Promise<void> => {
  const parsedEnv = adminEnvSchema.safeParse(process.env);

  if (!parsedEnv.success) {
    const issues = parsedEnv.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(
      `Invalid admin environment configuration: ${issues}`,
    );
  }

  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = parsedEnv.data;

  await connectDatabase();

  const existingAdmin = await User.findOne({
    email: ADMIN_EMAIL,
  }).select("+password");

  if (existingAdmin) {
    if (existingAdmin.role !== "admin") {
      throw new Error(
        "This email already belongs to a regular user. Choose a different ADMIN_EMAIL.",
      );
    }

    console.log("Admin account already exists. No changes made.");
    return;
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);

  await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: hashedPassword,
    role: "admin",
    interests: [],
  });

  console.log("Admin account created successfully.");
};

const main = async (): Promise<void> => {
  try {
    await seedAdmin();
  } catch (error: unknown) {
    console.error(
      "Admin seeding failed:",
      safeErrorMessage(error, [process.env.ADMIN_PASSWORD ?? ""]),
    );
    process.exitCode = 1;
  } finally {
    try {
      await disconnectDatabase();
    } catch (error: unknown) {
      console.error("Database disconnect failed:", safeErrorMessage(error));
      process.exitCode = 1;
    }
  }
};

void main();
