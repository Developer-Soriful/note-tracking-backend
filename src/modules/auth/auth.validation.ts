import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .refine(
    (value) => Buffer.byteLength(value, "utf8") <= 72,
    "Password must not exceed 72 UTF-8 bytes",
  );

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),

  email: z
    .email()
    .max(254)
    .transform((value) => value.trim().toLowerCase()),

  password: passwordSchema,

  interests: z
    .array(z.string().trim().min(1).max(50))
    .max(20)
    .optional()
    .default([]),
});

export const loginSchema = z.object({
  email: z
    .email()
    .max(254)
    .transform((value) => value.trim().toLowerCase()),

  password: z.string().min(1),
});
