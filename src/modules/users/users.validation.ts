import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(100),

  email: z
    .email()
    .max(254)
    .transform((value) => value.trim().toLowerCase()),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .refine(
      (value) => Buffer.byteLength(value, "utf8") <= 72,
      "Password must not exceed 72 UTF-8 bytes",
    ),

  interests: z
    .array(z.string().trim().min(1).max(50))
    .max(20)
    .optional()
    .default([]),
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),

    email: z
      .email()
      .max(254)
      .transform((value) => value.trim().toLowerCase())
      .optional(),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .refine(
        (value) => Buffer.byteLength(value, "utf8") <= 72,
        "Password must not exceed 72 UTF-8 bytes",
      )
      .optional(),

    role: z.enum(["user", "admin"]).optional(),

    interests: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field is required",
  );

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const userIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID");
