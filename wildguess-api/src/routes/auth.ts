import { Hono } from 'hono';
import { db } from '../database/drizzle.config.js';
import { users, sessions } from '../database/schema.js';
import { eq } from 'drizzle-orm';
import { randomBytes, scryptSync } from 'node:crypto';

const auth = new Hono();

function hashPassword(password: string, salt: string): string {
    return scryptSync(password, salt, 64).toString('hex');
}

function generateToken(): string {
    return randomBytes(32).toString('hex');
}

function generateId(): string {
    return randomBytes(16).toString('hex');
}

// POST /api/auth/register
auth.post('/register', async (c) => {
    const body = await c.req.json<{ username: string; password: string }>();

    if (!body.username || !body.password) {
        return c.json({ error: 'Username and password are required' }, 400);
    }

    if (body.username.length < 3 || body.username.length > 20) {
        return c.json({ error: 'Username must be between 3 and 20 characters' }, 400);
    }

    if (body.password.length < 6) {
        return c.json({ error: 'Password must be at least 6 characters' }, 400);
    }

    // Check if username already exists
    const existing = db
        .select()
        .from(users)
        .where(eq(users.username, body.username))
        .get();

    if (existing) {
        return c.json({ error: 'Username already taken' }, 409);
    }

    const salt = randomBytes(16).toString('hex');
    const passwordHash = `${salt}:${hashPassword(body.password, salt)}`;
    const userId = generateId();
    const now = Date.now();

    db.insert(users)
        .values({
            id: userId,
            username: body.username,
            passwordHash,
            createdAt: now,
        })
        .run();

    // Create session
    const token = generateToken();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days

    db.insert(sessions)
        .values({ token, userId, expiresAt })
        .run();

    return c.json({
        token,
        user: { id: userId, username: body.username },
    });
});

// POST /api/auth/login
auth.post('/login', async (c) => {
    const body = await c.req.json<{ username: string; password: string }>();

    if (!body.username || !body.password) {
        return c.json({ error: 'Username and password are required' }, 400);
    }

    const user = db
        .select()
        .from(users)
        .where(eq(users.username, body.username))
        .get();

    if (!user) {
        return c.json({ error: 'Invalid credentials' }, 401);
    }

    const [salt, hash] = user.passwordHash.split(':');
    const inputHash = hashPassword(body.password, salt);

    if (hash !== inputHash) {
        return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Create session
    const token = generateToken();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    db.insert(sessions)
        .values({ token, userId: user.id, expiresAt })
        .run();

    return c.json({
        token,
        user: { id: user.id, username: user.username },
    });
});

// POST /api/auth/logout
auth.post('/logout', async (c) => {
    const authHeader = c.req.header('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        db.delete(sessions).where(eq(sessions.token, token)).run();
    }
    return c.json({ success: true });
});

// GET /api/auth/me
auth.get('/me', async (c) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.slice(7);
    const session = db
        .select()
        .from(sessions)
        .where(eq(sessions.token, token))
        .get();

    if (!session || session.expiresAt < Date.now()) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const user = db
        .select({ id: users.id, username: users.username })
        .from(users)
        .where(eq(users.id, session.userId))
        .get();

    if (!user) {
        return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user });
});

export default auth;
