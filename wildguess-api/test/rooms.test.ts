import { describe, it, expect, beforeEach } from 'vitest';
import app from '../src/app.js';
import { db } from '../src/database/drizzle.config.js';
import { rooms, users, roomMembers, sessions } from '../src/database/schema.js';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';

describe('Room Routes (/api/rooms)', () => {

  beforeEach(() => {
    db.delete(roomMembers).run();
    db.delete(rooms).run();
    db.delete(sessions).run();
    db.delete(users).run();
  });

  const setupMockUserAndSession = () => {
    const userId = 'test-user-id';
    db.insert(users).values({
      id: userId,
      username: 'testuser',
      passwordHash: 'fake-hash',
      createdAt: Date.now()
    }).run();

    const token = randomBytes(32).toString('base64url');
    db.insert(sessions).values({
      token,
      userId,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 // 1 day future
    }).run();

    return { userId, token };
  };

  describe('POST /', () => {
    it('should reject requests without a valid session token', async () => {
      const res = await app.request('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer fake-token-not-really-used-yet`,
        },
        body: JSON.stringify({ name: 'Sprint Planning Room' })
      });

      // The current authMiddleware requires a valid session token in DB.
      // Since we provided a fake token that doesn't exist in the session table,
      // the middleware correctly rejects the request with a 401.
      expect(res.status).toBe(401);
    });

    it('should create a new room with valid data and a valid session', async () => {
      const { token, userId } = setupMockUserAndSession();

      const res = await app.request('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: 'Sprint Planning Room' })
      });

      expect(res.status).toBe(200);
      const data = await res.json() as { roomId: string };
      
      expect(data.roomId).toBeDefined();
      expect(data.roomId.length).toBe(6); // generateRoomCode creates a 6 char hex

      // Verify it was correctly inserted into DB
      const dbRoom = db.select().from(rooms).where(eq(rooms.id, data.roomId)).get();
      expect(dbRoom).toBeDefined();
      expect(dbRoom?.name).toBe('Sprint Planning Room');
      expect(dbRoom?.hostId).toBe(userId);
    });

    it('should return 400 when the room name is missing', async () => {
      const { token } = setupMockUserAndSession();

      const res = await app.request('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: '   ' }) // Empty name
      });

      expect(res.status).toBe(400);
      const data = await res.json() as { error: string };
      expect(data.error).toBe('Room name is required');
    });
  });
});
