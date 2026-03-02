import { describe, it, expect, beforeEach } from "vitest";
import app from "../src/app.js";
import { db } from "../src/database/drizzle.config.js";
import { users, sessions } from "../src/database/schema.js";

describe("Auth Routes (Case Insensitivity & Display Name)", () => {
  beforeEach(() => {
    db.delete(sessions).run();
    db.delete(users).run();
  });

  it("should preserve the original case of a full name username", async () => {
    const res = await app.request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username: "John Doe", password: "password123" }),
      headers: { "Content-Type": "application/json" },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.username).toBe("John Doe");

    // Verify in DB
    const user = db.select().from(users).get();
    expect(user?.username).toBe("John Doe");
  });

  it("should prevent registering a duplicate username with different case", async () => {
    // Register first user
    await app.request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username: "John Doe", password: "password123" }),
      headers: { "Content-Type": "application/json" },
    });

    // Try to register duplicate with different case
    const res = await app.request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username: "john doe", password: "password123" }),
      headers: { "Content-Type": "application/json" },
    });

    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toBe("Username already taken");
  });

  it("should allow login with a different case than registration", async () => {
    // Register
    await app.request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username: "Jane Smith", password: "password123" }),
      headers: { "Content-Type": "application/json" },
    });

    // Login with lowercase
    const res = await app.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: "jane smith", password: "password123" }),
      headers: { "Content-Type": "application/json" },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.username).toBe("Jane Smith"); // Should return the original display name
  });
});
