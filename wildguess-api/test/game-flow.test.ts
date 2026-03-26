import { describe, it, expect, beforeEach } from "vitest";
import app from "../src/app.js";
import { db } from "../src/database/drizzle.config.js";
import {
  rooms,
  users,
  roomMembers,
  sessions,
  votes,
} from "../src/database/schema.js";
import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";

describe("Game Flow E2E", () => {
  beforeEach(() => {
    db.delete(votes).run();
    db.delete(roomMembers).run();
    db.delete(rooms).run();
    db.delete(sessions).run();
    db.delete(users).run();
  });

  const createUserAndSession = (userId: string, username: string) => {
    db.insert(users)
      .values({
        id: userId,
        username,
        passwordHash: "fake-hash",
        createdAt: Date.now(),
      })
      .run();

    const token = randomBytes(32).toString("base64url");
    db.insert(sessions)
      .values({
        token,
        userId,
        expiresAt: Date.now() + 1000 * 60 * 60 * 24,
      })
      .run();

    return { userId, token };
  };

  it("should complete a full game flow with host transfers", async () => {
    // 1. Setup users
    const user1 = createUserAndSession("user-1", "Alice");
    const user2 = createUserAndSession("user-2", "Bob");

    // 2. User 1 creates a room (User 1 is Host)
    const createRes = await app.request("/api/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user1.token}`,
      },
      body: JSON.stringify({ name: "Flow Test Room" }),
    });
    expect(createRes.status).toBe(200);
    const { roomId } = (await createRes.json()) as { roomId: string };

    // 3. User 2 joins the room
    const joinRes = await app.request(`/api/rooms/${roomId}/join`, {
      method: "POST",
      headers: { Authorization: `Bearer ${user2.token}` },
    });
    expect(joinRes.status).toBe(200);

    // 4. Round 1: Both vote
    const vote1Res = await app.request(`/api/rooms/${roomId}/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user1.token}`,
      },
      body: JSON.stringify({ value: "5" }),
    });
    expect(vote1Res.status).toBe(200);

    const vote2Res = await app.request(`/api/rooms/${roomId}/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user2.token}`,
      },
      body: JSON.stringify({ value: "8" }),
    });
    expect(vote2Res.status).toBe(200);

    // 5. User 1 (Host) reveals votes
    const reveal1Res = await app.request(`/api/rooms/${roomId}/reveal`, {
      method: "POST",
      headers: { Authorization: `Bearer ${user1.token}` },
    });
    expect(reveal1Res.status).toBe(200);

    // 6. User 1 (Host) triggers next round
    const next1Res = await app.request(`/api/rooms/${roomId}/next-round`, {
      method: "POST",
      headers: { Authorization: `Bearer ${user1.token}` },
    });
    expect(next1Res.status).toBe(200);

    // 7. User 1 (Host) transfers host to User 2
    const transfer1Res = await app.request(`/api/rooms/${roomId}/host`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user1.token}`,
      },
      body: JSON.stringify({ targetUserId: user2.userId }),
    });
    expect(transfer1Res.status).toBe(200);

    // Verify User 2 is now host
    let currentRoom = db.select().from(rooms).where(eq(rooms.id, roomId)).get();
    expect(currentRoom?.hostId).toBe(user2.userId);

    // 8. Round 2: Both vote again
    await app.request(`/api/rooms/${roomId}/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user1.token}`,
      },
      body: JSON.stringify({ value: "13" }),
    });
    await app.request(`/api/rooms/${roomId}/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user2.token}`,
      },
      body: JSON.stringify({ value: "21" }),
    });

    // 9. User 2 (New Host) reveals votes
    const reveal2Res = await app.request(`/api/rooms/${roomId}/reveal`, {
      method: "POST",
      headers: { Authorization: `Bearer ${user2.token}` },
    });
    expect(reveal2Res.status).toBe(200);

    // 10. User 2 (New Host) triggers next round
    const next2Res = await app.request(`/api/rooms/${roomId}/next-round`, {
      method: "POST",
      headers: { Authorization: `Bearer ${user2.token}` },
    });
    expect(next2Res.status).toBe(200);

    // 11. User 2 (Host) transfers host back to User 1
    const transfer2Res = await app.request(`/api/rooms/${roomId}/host`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user2.token}`,
      },
      body: JSON.stringify({ targetUserId: user1.userId }),
    });
    expect(transfer2Res.status).toBe(200);

    // Verify User 1 is host again
    currentRoom = db.select().from(rooms).where(eq(rooms.id, roomId)).get();
    expect(currentRoom?.hostId).toBe(user1.userId);
  });
});
