import { db } from '../database/drizzle.config.js';
import { rooms, roomMembers, votes } from '../database/schema.js';
import { eq, and } from 'drizzle-orm';
import { PresenceStore } from './presence.js';

export function purgeTimedOutUsers(timeoutMs: number, now = Date.now()): void {
  const inactiveMembers = PresenceStore.getInactiveUsers(timeoutMs, now);

  if (inactiveMembers.length === 0) return;

  console.log(`Purging ${inactiveMembers.length} inactive members...`);

  for (const member of inactiveMembers) {
    db.delete(roomMembers)
      .where(and(eq(roomMembers.roomId, member.roomId), eq(roomMembers.userId, member.userId)))
      .run();

    db.delete(votes)
      .where(and(eq(votes.roomId, member.roomId), eq(votes.userId, member.userId)))
      .run();

    const room = db.select().from(rooms).where(eq(rooms.id, member.roomId)).get();
    if (!room) continue;

    const remaining = db
      .select()
      .from(roomMembers)
      .where(eq(roomMembers.roomId, member.roomId))
      .all();

    if (remaining.length === 0) {
      db.delete(votes).where(eq(votes.roomId, member.roomId)).run();
      db.delete(rooms).where(eq(rooms.id, member.roomId)).run();
      console.log(`Deleted empty room ${member.roomId}`);
    } else if (room.hostId === member.userId) {
      const sorted = remaining.sort((a, b) => a.joinedAt - b.joinedAt);
      db.update(rooms).set({ hostId: sorted[0].userId }).where(eq(rooms.id, member.roomId)).run();
      console.log(`Reassigned host of room ${member.roomId} to ${sorted[0].userId}`);
    }

    PresenceStore.remove(member.roomId, member.userId);
  }
}
