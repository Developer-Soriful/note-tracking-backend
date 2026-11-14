import assert from "node:assert/strict";
import type { Server } from "node:http";
import { after, before, test } from "node:test";

process.env.NODE_ENV = "test";
process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/backend-tests";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-only-random-secret-with-more-than-32-characters";
process.env.CORS_ORIGINS = process.env.CORS_ORIGINS || "http://localhost:3000";

let server: Server;
let baseUrl: string;

before(async () => {
  const { default: app } = await import("../src/app");
  server = app.listen(0, "127.0.0.1");

  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const address = server.address();
  assert.ok(address && typeof address !== "string");
  baseUrl = `http://127.0.0.1:${address.port}/api/v1`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    if ("closeAllConnections" in server && typeof server.closeAllConnections === "function") {
      server.closeAllConnections();
    }
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("liveness endpoint responds without a database connection", async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    success: true,
    message: "API is running",
  });
});

test("readiness endpoint reports an unavailable database", async () => {
  const response = await fetch(`${baseUrl}/ready`);
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    success: false,
    message: "Service is not ready",
  });
});

test("login rejects invalid input and rate-limits repeated attempts", async () => {
  const firstResponse = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({}),
  });
  assert.equal(firstResponse.status, 400);

  let rateLimited = false;
  for (let attempt = 0; attempt < 12; attempt++) {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    if (response.status === 429) {
      const body = await response.json();
      assert.equal(body.code, "RATE_LIMITED");
      rateLimited = true;
      break;
    }
  }

  assert.equal(rateLimited, true);
});
