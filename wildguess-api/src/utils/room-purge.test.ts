import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../database/drizzle.config.js';
import { rooms, roomMembers, users, votes } from '../database/schema.js';
import { purgeTimedOutUsers } from './room-purge.js';
import { PresenceStore } from './presence.js';
import { eq } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import { randomBytes } from 'crypto';

describe('room-purge', () => {
  beforeEach(() => {
    // Clear tables for clean state
    db.delete(votes).run();
    db.delete(roomMembers).run();
    db.delete(rooms).run();
    db.delete(users).run();
    // Clear presence store
    (PresenceStore as any).store.clear();
  });

  it('should purge inactive user and keep active user', () => {
    // Setup
    const hostId = 'host-1';
    const memberId = 'member-1';
    const roomId = 'room-1';
    const now = Date.now();

    db.insert(users)
      .values([
        { id: hostId, username: 'host', passwordHash: 'hash', createdAt: now },
        { id: memberId, username: 'member', passwordHash: 'hash', createdAt: now },
      ])
      .run();

    db.insert(rooms)
      .values({
        id: roomId,
        name: 'Test Room',
        hostId,
        phase: 'voting',
        round: 1,
        createdAt: now,
      })
      .run();

    db.insert(roomMembers)
      .values([
        { roomId, userId: hostId, joinedAt: now }, // active
        { roomId, userId: memberId, joinedAt: now }, // inactive
      ])
      .run();

    // Manually push to PresenceStore bypass
    (PresenceStore as any).store.set(`${roomId}:${hostId}`, now);
    (PresenceStore as any).store.set(`${roomId}:${memberId}`, now - 60000);

    // Act
    purgeTimedOutUsers(30000, now);

    // Assert
    const remainingMembers = db.select().from(roomMembers).all();
    expect(remainingMembers).toHaveLength(1);
    expect(remainingMembers[0].userId).toBe(hostId);
  });

  it('should delete room if all members time out', () => {
    // Setup
    const hostId = 'host-2';
    const roomId = 'room-2';
    const now = Date.now();

    db.insert(users)
      .values({ id: hostId, username: 'host2', passwordHash: 'hash', createdAt: now })
      .run();

    db.insert(rooms)
      .values({
        id: roomId,
        name: 'Test Room 2',
        hostId,
        phase: 'voting',
        round: 1,
        createdAt: now,
      })
      .run();

    db.insert(roomMembers).values({ roomId, userId: hostId, joinedAt: now }).run();

    // Manually push to PresenceStore bypass
    (PresenceStore as any).store.set(`${roomId}:${hostId}`, now - 60000);

    // Act
    purgeTimedOutUsers(30000, now);

    // Assert
    const roomExists = db.select().from(rooms).where(eq(rooms.id, roomId)).get();
    expect(roomExists).toBeUndefined();
  });
});
