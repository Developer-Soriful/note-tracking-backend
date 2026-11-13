import mongoose from "mongoose";
import { env } from "../config/env";

export const connectDatabase = async (): Promise<void> => {
  try {
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
