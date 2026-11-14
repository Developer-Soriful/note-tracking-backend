import assert from "node:assert/strict";
import type { Server } from "node:http";
import { after, before, describe, it } from "node:test";

import { connectDatabase, disconnectDatabase } from "../src/database/connection";
import { User } from "../src/modules/users/users.model";
import { Note } from "../src/modules/notes/notes.model";
import { Post } from "../src/modules/posts/posts.model";

let server: Server;
let baseUrl: string;

// Unique identifier for isolating test fixtures
const testRunId = `test_${Date.now()}`;

let userAToken: string;
let userAId: string;
let userBToken: string;
let userBId: string;
let adminToken: string;
let adminId: string;

let userANoteId: string;
let userBNoteId: string;
let adminNoteId: string;

const request = async (
  path: string,
  options: {
    method?: string;
    token?: string;
    body?: Record<string, unknown>;
  } = {},
) => {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    connection: "close",
  };

  if (options.token) {
    headers.authorization = `Bearer ${options.token}`;
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  return { status: res.status, data };
};

before(async () => {
  await connectDatabase();

  const { default: app } = await import("../src/app");
  server = app.listen(0, "127.0.0.1");

  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const address = server.address();
  assert.ok(address && typeof address !== "string");
  baseUrl = `http://127.0.0.1:${address.port}/api/v1`;

  // Ensure indexes are synced
  await Promise.all([
    User.createIndexes(),
    Note.createIndexes(),
    Post.createIndexes(),
  ]);
});

after(async () => {
  // Clean up test data created during the run
  const testEmails = [
    `${testRunId}_usera@test.com`,
    `${testRunId}_userb@test.com`,
    `${testRunId}_admin@test.com`,
    `${testRunId}_created@test.com`,
  ];

  const testUsers = await User.find({ email: { $in: testEmails } }, { _id: 1 });
  const userIds = testUsers.map((u) => u._id);

  await Promise.all([
    User.deleteMany({ _id: { $in: userIds } }),
    Note.deleteMany({ user: { $in: userIds } }),
    Post.deleteMany({ user: { $in: userIds } }),
  ]);

  await disconnectDatabase();

  await new Promise<void>((resolve, reject) => {
    if ("closeAllConnections" in server && typeof server.closeAllConnections === "function") {
      server.closeAllConnections();
    }
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

describe("1. Database Indexing Verification", () => {
  it("User schema defines email, pagination, and interests indexes", async () => {
    const indexes = await User.collection.indexes();
    const indexNames = indexes.map((idx) => Object.keys(idx.key).join("_"));

    assert.ok(indexes.some((idx) => idx.key.email === 1 && idx.unique === true));
    assert.ok(indexes.some((idx) => idx.key.createdAt === -1 && idx.key._id === -1));
    assert.ok(indexes.some((idx) => idx.key.interests === 1));
  });

  it("Note schema defines compound ESR and pagination indexes", async () => {
    const indexes = await Note.collection.indexes();
    assert.ok(
      indexes.some(
        (idx) => idx.key.user === 1 && idx.key.createdAt === -1 && idx.key._id === -1,
      ),
    );
    assert.ok(indexes.some((idx) => idx.key.createdAt === -1 && idx.key._id === -1));
  });

  it("Post schema defines compound lookup equality and pagination indexes", async () => {
    const indexes = await Post.collection.indexes();
    assert.ok(
      indexes.some(
        (idx) => idx.key.user === 1 && idx.key.createdAt === -1 && idx.key._id === -1,
      ),
    );
    assert.ok(indexes.some((idx) => idx.key.createdAt === -1 && idx.key._id === -1));
  });
});

describe("2. Authentication & RBAC Setup", () => {
  it("registers regular User A with interests", async () => {
    const res = await request("/auth/register", {
      method: "POST",
      body: {
        name: "User Alpha",
        email: `${testRunId}_usera@test.com`,
        password: "Password123!",
        interests: ["chess", "algorithms"],
      },
    });

    assert.equal(res.status, 201);
    const data = res.data as { data: { accessToken: string; user: { id: string; role: string } } };
    assert.ok(data?.data?.accessToken);
    assert.equal(data.data.user.role, "user");
    userAToken = data.data.accessToken;
    userAId = data.data.user.id;
  });

  it("registers regular User B with interests", async () => {
    const res = await request("/auth/register", {
      method: "POST",
      body: {
        name: "User Beta",
        email: `${testRunId}_userb@test.com`,
        password: "Password123!",
        interests: ["chess", "reading"],
      },
    });

    assert.equal(res.status, 201);
    const data = res.data as { data: { accessToken: string; user: { id: string; role: string } } };
    userBToken = data.data.accessToken;
    userBId = data.data.user.id;
  });

  it("registers an Admin user", async () => {
    const res = await request("/auth/register", {
      method: "POST",
      body: {
        name: "Admin User",
        email: `${testRunId}_admin@test.com`,
        password: "Password123!",
        interests: ["leadership", "reading"],
      },
    });

    assert.equal(res.status, 201);
    const data = res.data as { data: { accessToken: string; user: { id: string } } };
    adminId = data.data.user.id;

    // Promote to admin in DB for testing
    await User.updateOne({ _id: adminId }, { $set: { role: "admin" } });

    // Login to get token with admin role claim
    const loginRes = await request("/auth/login", {
      method: "POST",
      body: {
        email: `${testRunId}_admin@test.com`,
        password: "Password123!",
      },
    });

    assert.equal(loginRes.status, 200);
    const loginData = loginRes.data as { data: { accessToken: string; user: { role: string } } };
    assert.equal(loginData.data.user.role, "admin");
    adminToken = loginData.data.accessToken;
  });
});

describe("3. Notes CRUD & Permissions (User Isolation vs Admin Visibility)", () => {
  it("User A creates a note", async () => {
    const res = await request("/notes", {
      method: "POST",
      token: userAToken,
      body: {
        title: "User A Note 1",
        content: "Secret content of user A",
      },
    });

    assert.equal(res.status, 201);
    const data = res.data as { data: { id: string; title: string; userId: string } };
    assert.equal(data.data.title, "User A Note 1");
    assert.equal(data.data.userId, userAId);
    userANoteId = data.data.id;
  });

  it("User B creates a note", async () => {
    const res = await request("/notes", {
      method: "POST",
      token: userBToken,
      body: {
        title: "User B Note 1",
        content: "Secret content of user B",
      },
    });

    assert.equal(res.status, 201);
    const data = res.data as { data: { id: string } };
    userBNoteId = data.data.id;
  });

  it("Admin creates a note", async () => {
    const res = await request("/notes", {
      method: "POST",
      token: adminToken,
      body: {
        title: "Admin Personal Note",
        content: "Admin personal content",
      },
    });

    assert.equal(res.status, 201);
    const data = res.data as { data: { id: string } };
    adminNoteId = data.data.id;
  });

  it("User A lists their notes: receives ONLY User A's note (isolation enforced)", async () => {
    const res = await request("/notes", {
      token: userAToken,
    });

    assert.equal(res.status, 200);
    const data = res.data as { data: { notes: Array<{ id: string; userId: string }> } };
    assert.ok(data.data.notes.every((n) => n.userId === userAId));
    assert.ok(data.data.notes.some((n) => n.id === userANoteId));
    assert.ok(!data.data.notes.some((n) => n.id === userBNoteId));
  });

  it("User B cannot view User A's note by ID", async () => {
    const res = await request(`/notes/${userANoteId}`, {
      token: userBToken,
    });
    assert.equal(res.status, 404);
  });

  it("User B cannot update User A's note", async () => {
    const res = await request(`/notes/${userANoteId}`, {
      method: "PATCH",
      token: userBToken,
      body: { title: "Hacked Title" },
    });
    assert.equal(res.status, 404);
  });

  it("User B cannot delete User A's note", async () => {
    const res = await request(`/notes/${userANoteId}`, {
      method: "DELETE",
      token: userBToken,
    });
    assert.equal(res.status, 404);
  });

  it("Admin can view everyone's notes when listing without mine=true", async () => {
    const res = await request("/notes", {
      token: adminToken,
    });

    assert.equal(res.status, 200);
    const data = res.data as { data: { notes: Array<{ id: string }> } };
    const noteIds = data.data.notes.map((n) => n.id);
    assert.ok(noteIds.includes(userANoteId));
    assert.ok(noteIds.includes(userBNoteId));
    assert.ok(noteIds.includes(adminNoteId));
  });

  it("Admin can view ONLY their own notes when query param mine=true is passed", async () => {
    const res = await request("/notes?mine=true", {
      token: adminToken,
    });

    assert.equal(res.status, 200);
    const data = res.data as { data: { notes: Array<{ id: string; userId: string }> } };
    assert.ok(data.data.notes.every((n) => n.userId === adminId));
    assert.ok(data.data.notes.some((n) => n.id === adminNoteId));
    assert.ok(!data.data.notes.some((n) => n.id === userANoteId));
  });

  it("Admin can view any note by ID", async () => {
    const res = await request(`/notes/${userANoteId}`, {
      token: adminToken,
    });

    assert.equal(res.status, 200);
    const data = res.data as { data: { id: string; title: string } };
    assert.equal(data.data.id, userANoteId);
    assert.equal(data.data.title, "User A Note 1");
  });
});

describe("4. Admin User Management", () => {
  it("Admin can list all users with pagination", async () => {
    const res = await request("/users?page=1&limit=10", {
      token: adminToken,
    });

    assert.equal(res.status, 200);
    const data = res.data as { data: { users: Array<{ id: string }>; pagination: { totalUsers: number } } };
    assert.ok(data.data.users.length > 0);
    assert.ok(data.data.pagination.totalUsers >= 3);
  });

  it("Regular user is forbidden from listing users", async () => {
    const res = await request("/users", {
      token: userAToken,
    });
    assert.equal(res.status, 403);
  });

  it("Admin can create a new user", async () => {
    const res = await request("/users", {
      method: "POST",
      token: adminToken,
      body: {
        name: "Managed User",
        email: `${testRunId}_created@test.com`,
        password: "Password123!",
        interests: ["sports"],
      },
    });

    assert.equal(res.status, 201);
    const data = res.data as { data: { id: string; email: string } };
    assert.equal(data.data.email, `${testRunId}_created@test.com`);
  });

  it("Admin cannot delete themselves", async () => {
    const res = await request(`/users/${adminId}`, {
      method: "DELETE",
      token: adminToken,
    });

    assert.equal(res.status, 403);
  });
});

describe("5. Scenario 1: Group by Interests Aggregation", () => {
  it("Admin retrieves users grouped by interests using single aggregate pipeline", async () => {
    const res = await request("/reports/users-by-interest?page=1&limit=20", {
      token: adminToken,
    });

    assert.equal(res.status, 200);
    const data = res.data as {
      data: {
        reports: Array<{ interest: string; totalUsers: number; users: Array<{ name: string; email: string }> }>;
        pagination: { totalInterests: number };
      };
    };

    assert.ok(Array.isArray(data.data.reports));
    assert.ok(data.data.reports.length > 0);

    const chessGroup = data.data.reports.find((r) => r.interest === "chess");
    assert.ok(chessGroup, "chess interest should be grouped");
    assert.ok(chessGroup.totalUsers >= 2, "Both User A and User B should be in chess group");
    const chessEmails = chessGroup.users.map((u) => u.email);
    assert.ok(chessEmails.includes(`${testRunId}_usera@test.com`));
    assert.ok(chessEmails.includes(`${testRunId}_userb@test.com`));
  });

  it("Regular user cannot access interests report", async () => {
    const res = await request("/reports/users-by-interest", {
      token: userAToken,
    });
    assert.equal(res.status, 403);
  });
});

describe("6. Scenario 2: User Posts ($lookup) Aggregation", () => {
  it("creates posts for User A and retrieves them via $lookup pipeline", async () => {
    // Create two posts for User A
    const postRes1 = await request("/posts", {
      method: "POST",
      token: userAToken,
      body: {
        title: "Post 1 about Distributed Systems",
        content: "Content about Paxos and Raft",
      },
    });
    assert.equal(postRes1.status, 201);

    const postRes2 = await request("/posts", {
      method: "POST",
      token: userAToken,
      body: {
        title: "Post 2 about MongoDB Aggregations",
        content: "Content about $lookup pipelines",
      },
    });
    assert.equal(postRes2.status, 201);

    // Retrieve posts belonging to User A via $lookup aggregation
    const getRes = await request(`/posts/user/${userAId}?page=1&limit=10`);
    assert.equal(getRes.status, 200);

    const data = getRes.data as {
      data: {
        user: { id: string; name: string };
        posts: Array<{ id: string; title: string; userId: string }>;
        pagination: { totalPosts: number };
      };
    };

    assert.equal(data.data.user.id, userAId);
    assert.equal(data.data.pagination.totalPosts, 2);
    assert.equal(data.data.posts.length, 2);
    assert.equal(data.data.posts[0].userId, userAId);
  });

  it("retrieves all posts publicly without authentication", async () => {
    const res = await request("/posts?page=1&limit=10");
    assert.equal(res.status, 200);

    const data = res.data as {
      data: {
        posts: Array<{ id: string; title: string; authorName: string }>;
        pagination: { totalPosts: number };
      };
    };

    assert.ok(Array.isArray(data.data.posts));
    assert.ok(data.data.posts.length >= 2);
    assert.ok(data.data.posts.some((p) => p.authorName === "User Alpha"));
  });
});
