import app from "./app";
import { env } from "./config/env";
import { connectDatabase, disconnectDatabase } from "./database/connection";
import dns from "node:dns";

// Development-only DNS workaround
if (process.env.NODE_ENV !== "production") {
  dns.setServers(["1.1.1.1", "1.0.0.1"]);
}
const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();

    const server = app.listen(env.PORT, () => {
      console.log(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });

    let isShuttingDown = false;

    const shutdown = (signal: string): void => {
      if (isShuttingDown) return;

      isShuttingDown = true;

      console.log(`${signal} received. Shutting down gracefully...`);

      server.close(async (error) => {
        try {
          if (error) {
            console.error("HTTP server shutdown failed:", error);
            process.exitCode = 1;
          }

          await disconnectDatabase();

          console.log("Application shutdown completed");
        } catch (shutdownError: unknown) {
          console.error("Shutdown error:", shutdownError);
          process.exitCode = 1;
        }
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error: unknown) {
    console.error("Application startup failed:", error);
    process.exitCode = 1;
  }
};

void startServer();
