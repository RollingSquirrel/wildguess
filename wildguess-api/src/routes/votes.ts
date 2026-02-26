import { Hono } from 'hono';
import { db } from '../database/drizzle.config.js';
import { rooms, votes, roomMembers } from '../database/schema.js';
import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import { authMiddleware } from '../middleware/auth.js';
import type { AppEnv } from '../types.js';

const voteRoutes = new Hono<AppEnv>();

voteRoutes.use('*', authMiddleware);

const FIBONACCI_VALUES = ['1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?'];

function generateId(): string {
    return randomBytes(16).toString('hex');
}

// POST /api/rooms/:id/vote
voteRoutes.post('/:id/vote', async (c) => {
    const userId = c.get('userId');
    const roomId = c.req.param('id');

    const room = db.select().from(rooms).where(eq(rooms.id, roomId)).get();
    if (!room) return c.json({ error: 'Room not found' }, 404);
    if (room.phase !== 'voting') return c.json({ error: 'Voting is not active' }, 400);

    const membership = db
        .select()
        .from(roomMembers)
        .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)))
        .get();
    if (!membership) return c.json({ error: 'Not a member of this room' }, 403);

    const body = await c.req.json<{ value: string }>();
    if (!FIBONACCI_VALUES.includes(body.value)) {
        return c.json({ error: 'Invalid vote value' }, 400);
    }

    // Upsert: delete existing then insert
    db.delete(votes)
        .where(and(eq(votes.roomId, roomId), eq(votes.userId, userId), eq(votes.round, room.round)))
        .run();

    db.insert(votes)
        .values({
            id: generateId(),
            roomId,
            userId,
            round: room.round,
            value: body.value,
            createdAt: Date.now(),
        })
        .run();

    return c.json({ success: true });
});

// POST /api/rooms/:id/reveal
voteRoutes.post('/:id/reveal', async (c) => {
    const userId = c.get('userId');
    const roomId = c.req.param('id');

    const room = db.select().from(rooms).where(eq(rooms.id, roomId)).get();
    if (!room) return c.json({ error: 'Room not found' }, 404);
    if (room.hostId !== userId) return c.json({ error: 'Only the host can reveal votes' }, 403);
    if (room.phase !== 'voting') return c.json({ error: 'Not in voting phase' }, 400);

    db.update(rooms).set({ phase: 'revealed' }).where(eq(rooms.id, roomId)).run();
    return c.json({ success: true });
});

// POST /api/rooms/:id/versus
voteRoutes.post('/:id/versus', async (c) => {
    const userId = c.get('userId');
    const roomId = c.req.param('id');

    const room = db.select().from(rooms).where(eq(rooms.id, roomId)).get();
    if (!room) return c.json({ error: 'Room not found' }, 404);
    if (room.hostId !== userId) return c.json({ error: 'Only the host can trigger versus' }, 403);
    if (room.phase !== 'revealed') return c.json({ error: 'Not in revealed phase' }, 400);

    db.update(rooms).set({ phase: 'versus' }).where(eq(rooms.id, roomId)).run();
    return c.json({ success: true });
});

// POST /api/rooms/:id/next-round
voteRoutes.post('/:id/next-round', async (c) => {
    const userId = c.get('userId');
    const roomId = c.req.param('id');

    const room = db.select().from(rooms).where(eq(rooms.id, roomId)).get();
    if (!room) return c.json({ error: 'Room not found' }, 404);
    if (room.hostId !== userId) return c.json({ error: 'Only the host can start next round' }, 403);

    db.update(rooms)
        .set({ phase: 'voting', round: room.round + 1, currentTopic: null })
        .where(eq(rooms.id, roomId))
        .run();

    return c.json({ success: true, round: room.round + 1 });
});

export default voteRoutes;
