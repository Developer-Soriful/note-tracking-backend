import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import { env } from "./config/env";
import { notFoundMiddleware } from "./shared/middleware/not-found.middleware";
import { errorMiddleware } from "./shared/middleware/error.middleware";
import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
import notesRoutes from "./modules/notes/notes.routes";
import postsRoutes from "./modules/posts/posts.routes";
import reportsRoutes from "./modules/reports/reports.routes";
const app = express();

app.use(helmet());

app.use(
  cors({
    origin: env.CORS_ORIGINS,
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));

app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// LIVENESS CHECK
app.get("/api/v1/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
  });
});

// READINESS CHECK
app.get("/api/v1/ready", (_req, res) => {
  const isDatabaseConnected = mongoose.connection.readyState === 1;

  if (!isDatabaseConnected) {
    return res.status(503).json({
      success: false,
      message: "Service is not ready",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Service is ready",
  });
});

// AUTH ROUTES
app.use("/api/v1/auth", authRoutes);

// USERS ROUTES
app.use("/api/v1/users", usersRoutes);

// NOTES ROUTES
app.use("/api/v1/notes", notesRoutes);

// POSTS ROUTES
app.use("/api/v1/posts", postsRoutes);

// REPORTS ROUTES
app.use("/api/v1/reports", reportsRoutes);


// HANDLE NOT FOUND ROUTES
app.use(notFoundMiddleware);

// CENTRALIZED ERROR HANDLER
app.use(errorMiddleware);


export default app;
