
import mongoose from "mongoose";
import dns from "node:dns";

import { env } from "../config/env";
import { safeErrorMessage } from "../shared/utils/safe-error-message";

export const connectDatabase = async (): Promise<void> => {
  try {
    // Development-only DNS workaround.
    // Production will use the system DNS configuration.
    if (env.NODE_ENV !== "production") {
      dns.setServers(["1.1.1.1", "1.0.0.1"]);
    }

    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10_000,
      autoIndex: env.NODE_ENV !== "production",
      autoCreate: env.NODE_ENV !== "production",
    });

    console.log("MongoDB connected successfully");
  } catch (error: unknown) {
    console.error("MongoDB connection failed:", safeErrorMessage(error));
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();

  console.log("MongoDB disconnected");
};
