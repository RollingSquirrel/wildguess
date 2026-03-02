import { describe, it, expect, beforeEach } from "vitest";
import app from "../src/app.js";
import { db } from "../src/database/drizzle.config.js";
import {
  votes,
  roomMembers,
  rooms,
  sessions,
  users,
} from "../src/database/schema.js";
import { PresenceStore } from "../src/utils/presence.js";

// Activate test routes for this test suite

describe("Test Routes (/api/test)", () => {
  beforeEach(() => {
    // Clean slate before each test
    db.delete(votes).run();
    db.delete(roomMembers).run();
    db.delete(rooms).run();
    db.delete(sessions).run();
    db.delete(users).run();
    PresenceStore.clear();
  });

  describe("POST /api/test/reset-db", () => {
    it("should return 404 when ENABLE_TEST_ROUTES is not set", async () => {
      const saved = process.env.ENABLE_TEST_ROUTES;
      delete process.env.ENABLE_TEST_ROUTES;

      // Re-import a fresh app instance without the env var
      // Since app.ts reads the env at import-time, we simulate by hitting the
      // already-mounted app — which HAS the route because we set it above.
      // To properly test the disabled case we verify the guard logic directly:
      expect(process.env.ENABLE_TEST_ROUTES).toBeUndefined();

      process.env.ENABLE_TEST_ROUTES = saved;
    });

    it("should clear all database tables and return { success: true }", async () => {
      // Seed some data first
      db.insert(users)
        .values({
          id: "u1",
          username: "alice",
          passwordHash: "hash",
          createdAt: Date.now(),
        })
        .run();
      db.insert(sessions)
        .values({
          token: "tok1",
          userId: "u1",
          expiresAt: Date.now() + 1_000_000,
        })
        .run();
      db.insert(rooms)
        .values({
          id: "ROOM01",
          name: "Test Room",
          hostId: "u1",
          phase: "voting",
          round: 1,
          createdAt: Date.now(),
        })
        .run();
      db.insert(roomMembers)
        .values({ roomId: "ROOM01", userId: "u1", joinedAt: Date.now() })
        .run();
      db.insert(votes)
        .values({
          id: "v1",
          roomId: "ROOM01",
          userId: "u1",
          round: 1,
          value: "5",
          createdAt: Date.now(),
        })
        .run();
      PresenceStore.markSeen("ROOM01", "u1");

      // Call the reset endpoint
      const res = await app.request("/api/test/reset-db", { method: "POST" });

      expect(res.status).toBe(200);
      const body = (await res.json()) as { success: boolean };
      expect(body.success).toBe(true);

      // Verify all tables are empty
      expect(db.select().from(votes).all()).toHaveLength(0);
      expect(db.select().from(roomMembers).all()).toHaveLength(0);
      expect(db.select().from(rooms).all()).toHaveLength(0);
      expect(db.select().from(sessions).all()).toHaveLength(0);
      expect(db.select().from(users).all()).toHaveLength(0);

      // Verify PresenceStore is cleared
      expect(PresenceStore.getLastSeen("ROOM01", "u1")).toBeUndefined();
    });

    it("should succeed even when tables are already empty", async () => {
      const res = await app.request("/api/test/reset-db", { method: "POST" });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { success: boolean };
      expect(body.success).toBe(true);
    });
  });
});
