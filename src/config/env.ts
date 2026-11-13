import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const corsOriginsSchema = z.string().transform((value, context) => {
  const origins = value.split(",").map((origin) => origin.trim());
  const hasInvalidOrigin = origins.some((origin) => {
    try {
      const url = new URL(origin);
      return (
        !["http:", "https:"].includes(url.protocol) ||
        url.origin !== origin ||
        Boolean(url.username || url.password)
      );
    } catch {
      return true;
    }
  });

  if (hasInvalidOrigin) {
    context.addIssue({
      code: "custom",
      message:
        "CORS_ORIGINS must be a comma-separated list of HTTP(S) origins without paths or credentials",
    });
  }

  return origins;
});

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),

  PORT: z.coerce.number().int().min(1).max(65535).default(5000),

  HOST: z.string().trim().min(1).default("127.0.0.1"),

  MONGODB_URI: z
    .string()
    .min(1, "MONGODB_URI is required")
    .refine(
      (value) => /^mongodb(?:\+srv)?:\/\//.test(value),
      "MONGODB_URI must use the mongodb:// or mongodb+srv:// protocol",
    )
    .refine(
      (value) => !/[<>]/.test(value),
      "MONGODB_URI must not contain unfilled example placeholders",
    ),

  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters")
    .refine(
      (value) => !/^(?:replace|change[-_ ]?me|your[-_ ]?)/i.test(value),
      "JWT_SECRET must not be an example or placeholder value",
    ),

  CORS_ORIGINS: corsOriginsSchema,
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment configuration:");

  for (const issue of result.error.issues) {
    console.error(`- ${issue.path.join(".")}: ${issue.message}`);
  }

  process.exit(1);
}

export const env = {
  ...result.data,
};
