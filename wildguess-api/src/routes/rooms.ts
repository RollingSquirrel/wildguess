import { Hono } from 'hono';
import { db } from '../database/drizzle.config.js';
import { rooms, roomMembers, users, votes } from '../database/schema.js';
import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import { authMiddleware } from '../middleware/auth.js';
import type { AppEnv } from '../types.js';

const roomRoutes = new Hono<AppEnv>();

roomRoutes.use('*', authMiddleware);

function generateRoomCode(): string {
    return randomBytes(3).toString('hex').toUpperCase();
}

function generateId(): string {
    return randomBytes(16).toString('hex');
}

// POST /api/rooms - Create a room
roomRoutes.post('/', async (c) => {
    const userId = c.get('userId');
    const body = await c.req.json<{ name: string }>();

    if (!body.name || body.name.trim().length === 0) {
        return c.json({ error: 'Room name is required' }, 400);
    }

    const roomId = generateRoomCode();
    const now = Date.now();

    db.insert(rooms)
        .values({
            id: roomId,
            name: body.name.trim(),
            hostId: userId,
            phase: 'voting',
            round: 1,
            createdAt: now,
        })
        .run();

    db.insert(roomMembers)
        .values({ roomId, userId, joinedAt: now })
        .run();

    return c.json({ roomId });
});

// GET /api/rooms - List rooms the user is in
roomRoutes.get('/', async (c) => {
    const userId = c.get('userId');

    const memberships = db
        .select({ roomId: roomMembers.roomId })
        .from(roomMembers)
        .where(eq(roomMembers.userId, userId))
        .all();

    if (memberships.length === 0) {
        return c.json({ rooms: [] });
    }

    const result = [];
    for (const m of memberships) {
        const room = db.select().from(rooms).where(eq(rooms.id, m.roomId)).get();
        if (!room) continue;

        const memberCount = db
            .select({ userId: roomMembers.userId })
            .from(roomMembers)
            .where(eq(roomMembers.roomId, m.roomId))
            .all().length;

        result.push({
            id: room.id,
            name: room.name,
            phase: room.phase,
            memberCount,
            isHost: room.hostId === userId,
        });
    }

    return c.json({ rooms: result });
});

// GET /api/rooms/:id - Full room state (poll endpoint)
roomRoutes.get('/:id', async (c) => {
    const userId = c.get('userId');
    const roomId = c.req.param('id');

    const room = db.select().from(rooms).where(eq(rooms.id, roomId)).get();
    if (!room) return c.json({ error: 'Room not found' }, 404);

    const membership = db
        .select()
        .from(roomMembers)
        .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)))
        .get();

    if (!membership) return c.json({ error: 'Not a member of this room' }, 403);

    const members = db
        .select({
            userId: roomMembers.userId,
            username: users.username,
            joinedAt: roomMembers.joinedAt,
        })
        .from(roomMembers)
        .innerJoin(users, eq(roomMembers.userId, users.id))
        .where(eq(roomMembers.roomId, roomId))
        .all();

    const currentVotes = db
        .select({ userId: votes.userId, value: votes.value })
        .from(votes)
        .where(and(eq(votes.roomId, roomId), eq(votes.round, room.round)))
        .all();

    const memberList = members.map((m) => {
        const vote = currentVotes.find((v) => v.userId === m.userId);
        return {
            userId: m.userId,
            username: m.username,
            isHost: m.userId === room.hostId,
            hasVoted: !!vote,
            vote: room.phase === 'voting' ? undefined : vote?.value ?? undefined,
        };
    });

    let stats = undefined;
    let versus = undefined;

    if (room.phase === 'revealed' || room.phase === 'versus') {
        const numericVotes = currentVotes
            .filter((v) => v.value !== null && v.value !== '?')
            .map((v) => parseInt(v.value!, 10));

        if (numericVotes.length > 0) {
            const sorted = [...numericVotes].sort((a, b) => a - b);
            const avg = numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length;

            const freq = new Map<number, number>();
            for (const v of numericVotes) {
                freq.set(v, (freq.get(v) ?? 0) + 1);
            }
            const maxFreq = Math.max(...freq.values());
            const mode = [...freq.entries()].filter(([, f]) => f === maxFreq).map(([v]) => v);

            stats = {
                average: Math.round(avg * 100) / 100,
                median: sorted[Math.floor(sorted.length / 2)],
                min: sorted[0],
                max: sorted[sorted.length - 1],
                mode,
                totalVotes: currentVotes.length,
                distribution: Object.fromEntries(freq),
            };
        }
    }

    if (room.phase === 'versus') {
        const numericVoters = currentVotes
            .filter((v) => v.value !== null && v.value !== '?')
            .map((v) => ({ userId: v.userId, value: parseInt(v.value!, 10) }));

        if (numericVoters.length >= 2) {
            const sortedVoters = [...numericVoters].sort((a, b) => a.value - b.value);
            const lowest = sortedVoters[0];
            const highest = sortedVoters[sortedVoters.length - 1];

            if (lowest.value !== highest.value) {
                const lowMember = members.find((m) => m.userId === lowest.userId);
                const highMember = members.find((m) => m.userId === highest.userId);

                versus = {
                    low: {
                        userId: lowest.userId,
                        username: lowMember?.username ?? 'Unknown',
                        vote: lowest.value.toString(),
                    },
                    high: {
                        userId: highest.userId,
                        username: highMember?.username ?? 'Unknown',
                        vote: highest.value.toString(),
                    },
                };
            }
        }
    }

    return c.json({
        id: room.id,
        name: room.name,
        phase: room.phase,
        round: room.round,
        currentTopic: room.currentTopic,
        hostId: room.hostId,
        isHost: room.hostId === userId,
        members: memberList,
        stats,
        versus,
    });
});

// POST /api/rooms/:id/join
roomRoutes.post('/:id/join', async (c) => {
    const userId = c.get('userId');
    const roomId = c.req.param('id');

    const room = db.select().from(rooms).where(eq(rooms.id, roomId)).get();
    if (!room) return c.json({ error: 'Room not found' }, 404);

    const existing = db
        .select()
        .from(roomMembers)
        .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)))
        .get();

    if (existing) return c.json({ success: true, alreadyMember: true });

    db.insert(roomMembers).values({ roomId, userId, joinedAt: Date.now() }).run();
    return c.json({ success: true });
});

// POST /api/rooms/:id/leave
roomRoutes.post('/:id/leave', async (c) => {
    const userId = c.get('userId');
    const roomId = c.req.param('id');

    const room = db.select().from(rooms).where(eq(rooms.id, roomId)).get();
    if (!room) return c.json({ error: 'Room not found' }, 404);

    db.delete(roomMembers)
        .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)))
        .run();

    db.delete(votes)
        .where(and(eq(votes.roomId, roomId), eq(votes.userId, userId)))
        .run();

    const remaining = db
        .select()
        .from(roomMembers)
        .where(eq(roomMembers.roomId, roomId))
        .all();

    if (remaining.length === 0) {
        db.delete(votes).where(eq(votes.roomId, roomId)).run();
        db.delete(rooms).where(eq(rooms.id, roomId)).run();
        return c.json({ success: true, roomDeleted: true });
    }

    if (room.hostId === userId) {
        const sorted = remaining.sort((a, b) => a.joinedAt - b.joinedAt);
        db.update(rooms).set({ hostId: sorted[0].userId }).where(eq(rooms.id, roomId)).run();
    }

    return c.json({ success: true });
});

// POST /api/rooms/:id/topic
roomRoutes.post('/:id/topic', async (c) => {
    const userId = c.get('userId');
    const roomId = c.req.param('id');

    const room = db.select().from(rooms).where(eq(rooms.id, roomId)).get();
    if (!room) return c.json({ error: 'Room not found' }, 404);
    if (room.hostId !== userId) return c.json({ error: 'Only the host can set the topic' }, 403);

    const body = await c.req.json<{ topic: string }>();
    db.update(rooms).set({ currentTopic: body.topic ?? null }).where(eq(rooms.id, roomId)).run();
    return c.json({ success: true });
});

// POST /api/rooms/:id/kick
roomRoutes.post('/:id/kick', async (c) => {
    const userId = c.get('userId');
    const roomId = c.req.param('id');

    const room = db.select().from(rooms).where(eq(rooms.id, roomId)).get();
    if (!room) return c.json({ error: 'Room not found' }, 404);
    if (room.hostId !== userId) return c.json({ error: 'Only the host can kick members' }, 403);

    const body = await c.req.json<{ targetUserId: string }>();
    if (body.targetUserId === userId) return c.json({ error: 'Cannot kick yourself' }, 400);

    db.delete(roomMembers)
        .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, body.targetUserId)))
        .run();
    db.delete(votes)
        .where(and(eq(votes.roomId, roomId), eq(votes.userId, body.targetUserId)))
        .run();

    return c.json({ success: true });
});

export default roomRoutes;
