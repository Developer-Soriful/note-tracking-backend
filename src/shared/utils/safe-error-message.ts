import { env } from "../../config/env";

export const safeErrorMessage = (
  error: unknown,
  additionalSecrets: readonly string[] = [],
): string => {
  let message =
    error instanceof Error ? error.message : "Unknown application error";

  for (const secret of [env.JWT_SECRET, env.MONGODB_URI, ...additionalSecrets]) {
    if (secret) {
      message = message.replaceAll(secret, "[REDACTED]");
    }
  }

  return message;
};
