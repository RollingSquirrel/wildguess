import { describe, it, expect, beforeEach } from "vitest";
import app from "../src/app.js";
import { db } from "../src/database/drizzle.config.js";
import { rooms, users, roomMembers, sessions } from "../src/database/schema.js";
import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";

describe("Room Routes (/api/rooms)", () => {
  beforeEach(() => {
    db.delete(roomMembers).run();
    db.delete(rooms).run();
    db.delete(sessions).run();
    db.delete(users).run();
  });

  const setupMockUserAndSession = () => {
    const userId = "test-user-id";
    db.insert(users)
      .values({
        id: userId,
        username: "testuser",
        passwordHash: "fake-hash",
        createdAt: Date.now(),
      })
      .run();

    const token = randomBytes(32).toString("base64url");
    db.insert(sessions)
      .values({
        token,
        userId,
        expiresAt: Date.now() + 1000 * 60 * 60 * 24, // 1 day future
      })
      .run();

    return { userId, token };
  };

  describe("POST /", () => {
    it("should reject requests without a valid session token", async () => {
      const res = await app.request("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer fake-token-not-really-used-yet`,
        },
        body: JSON.stringify({ name: "Sprint Planning Room" }),
      });

      // The current authMiddleware requires a valid session token in DB.
      // Since we provided a fake token that doesn't exist in the session table,
      // the middleware correctly rejects the request with a 401.
      expect(res.status).toBe(401);
    });

    it("should create a new room with valid data and a valid session", async () => {
      const { token, userId } = setupMockUserAndSession();

      const res = await app.request("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "Sprint Planning Room" }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as { roomId: string };

      expect(data.roomId).toBeDefined();
      expect(data.roomId.length).toBe(6); // generateRoomCode creates a 6 char hex

      // Verify it was correctly inserted into DB
      const dbRoom = db
        .select()
        .from(rooms)
        .where(eq(rooms.id, data.roomId))
        .get();
      expect(dbRoom).toBeDefined();
      expect(dbRoom?.name).toBe("Sprint Planning Room");
      expect(dbRoom?.hostId).toBe(userId);
    });

    it("should return 400 when the room name is missing", async () => {
      const { token } = setupMockUserAndSession();

      const res = await app.request("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "   " }), // Empty name
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as { error: string };
      expect(data.error).toBe("Room name is required");
    });
  });

  describe("POST /:id/host", () => {
    it("should allow the host to transfer host status to another member", async () => {
      const { token, userId } = setupMockUserAndSession();

      const createRes = await app.request("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "Host Transfer Room" }),
      });
      const { roomId } = (await createRes.json()) as { roomId: string };

      const targetUserId = "target-user-id";
      db.insert(users)
        .values({
          id: targetUserId,
          username: "target",
          passwordHash: "fake",
          createdAt: Date.now(),
        })
        .run();
      const targetToken = randomBytes(32).toString("base64url");
      db.insert(sessions)
        .values({
          token: targetToken,
          userId: targetUserId,
          expiresAt: Date.now() + 1000 * 60 * 60 * 24,
        })
        .run();

      await app.request(`/api/rooms/${roomId}/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${targetToken}` },
      });

      const transferRes = await app.request(`/api/rooms/${roomId}/host`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId }),
      });

      expect(transferRes.status).toBe(200);

      const updatedRoom = db
        .select()
        .from(rooms)
        .where(eq(rooms.id, roomId))
        .get();
      expect(updatedRoom?.hostId).toBe(targetUserId);
    });

    it("should not allow non-hosts to transfer host status", async () => {
      const { token } = setupMockUserAndSession();

      const createRes = await app.request("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "Another Room" }),
      });
      const { roomId } = (await createRes.json()) as { roomId: string };

      const nonHostId = "non-host-id";
      db.insert(users)
        .values({
          id: nonHostId,
          username: "nonhost",
          passwordHash: "fake",
          createdAt: Date.now(),
        })
        .run();
      const nonHostToken = randomBytes(32).toString("base64url");
      db.insert(sessions)
        .values({
          token: nonHostToken,
          userId: nonHostId,
          expiresAt: Date.now() + 1000 * 60 * 60 * 24,
        })
        .run();

      await app.request(`/api/rooms/${roomId}/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${nonHostToken}` },
      });

      const transferRes = await app.request(`/api/rooms/${roomId}/host`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${nonHostToken}`,
        },
        body: JSON.stringify({ targetUserId: "anyone" }),
      });

      expect(transferRes.status).toBe(403);
      const data = (await transferRes.json()) as { error: string };
      expect(data.error).toBe("Only the host can transfer host");
    });
  });
});
