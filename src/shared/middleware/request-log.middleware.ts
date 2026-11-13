import type { RequestHandler } from "express";
import { performance } from "node:perf_hooks";

export const requestLogMiddleware: RequestHandler = (_req, res, next) => {
  const startTime = performance.now();

  res.on("finish", () => {
    console.info(
      JSON.stringify({
        level: "info",
        event: "http_request",
        method: _req.method,
        statusCode: res.statusCode,
        durationMs: Math.round(performance.now() - startTime),
      }),
    );
  });

  next();
};
