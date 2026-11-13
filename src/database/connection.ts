
import mongoose from "mongoose";
import dns from "node:dns";

import { env } from "../config/env";

export const connectDatabase = async (): Promise<void> => {
  try {
    // Development-only DNS workaround.
    // Production will use the system DNS configuration.
    if (env.NODE_ENV !== "production") {
      dns.setServers(["1.1.1.1", "1.0.0.1"]);
    }

    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10_000,
    });

    console.log("MongoDB connected successfully");
  } catch (error: unknown) {
    console.error("MongoDB connection failed:", error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();

  console.log("MongoDB disconnected");
};
