import app from "./app";
import { env } from "./config/env";
import { connectDatabase, disconnectDatabase } from "./database/connection";
import { safeErrorMessage } from "./shared/utils/safe-error-message";
import type { Server } from "node:http";

const startServer = async (): Promise<void> => {
  let server: Server | undefined;

  try {
    await connectDatabase();

    server = app.listen(env.PORT, env.HOST);
    await new Promise<void>((resolve, reject) => {
      const onListening = (): void => {
        server?.off("error", onError);
        resolve();
      };
      const onError = (error: Error): void => {
        server?.off("listening", onListening);
        reject(error);
      };

      server?.once("listening", onListening);
      server?.once("error", onError);
    });
    server.on("error", (error) => {
      console.error("HTTP server error:", safeErrorMessage(error));
      process.exitCode = 1;
    });

    console.info(
      `Server running in ${env.NODE_ENV} mode on ${env.HOST}:${env.PORT}`,
    );

    let isShuttingDown = false;

    const shutdown = (signal: string): void => {
      if (isShuttingDown) return;

      isShuttingDown = true;

      console.log(`${signal} received. Shutting down gracefully...`);

      const shutdownTimeout = setTimeout(() => {
        console.error("Graceful shutdown timed out; closing active connections");
        server?.closeAllConnections();
      }, 10_000);

      server?.close(async (error) => {
        clearTimeout(shutdownTimeout);

        try {
          if (error) {
            throw error;
          }

          await disconnectDatabase();

          console.log("Application shutdown completed");
        } catch (shutdownError: unknown) {
          console.error("Shutdown error:", safeErrorMessage(shutdownError));
          process.exitCode = 1;
        }
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error: unknown) {
    console.error("Application startup failed:", safeErrorMessage(error));

    if (server?.listening) {
      await new Promise<void>((resolve) => {
        server?.close(() => resolve());
      });
    }

    try {
      await disconnectDatabase();
    } catch (shutdownError: unknown) {
      console.error("Startup cleanup failed:", safeErrorMessage(shutdownError));
    }

    process.exitCode = 1;
  }
};

void startServer();
