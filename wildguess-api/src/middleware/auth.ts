import { db } from '../database/drizzle.config.js';
import { sessions } from '../database/schema.js';
import { eq } from 'drizzle-orm';
import type { Context, Next } from 'hono';

/**
 * Auth middleware that reads the Bearer token from the Authorization header,
 * validates the session, and injects userId into the Hono context.
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);

  const session = db.select().from(sessions).where(eq(sessions.token, token)).get();

  if (!session) {
    return c.json({ error: 'Invalid session' }, 401);
  }

  if (session.expiresAt < Date.now()) {
    db.delete(sessions).where(eq(sessions.token, token)).run();
    return c.json({ error: 'Session expired' }, 401);
  }

  c.set('userId', session.userId);
  await next();
}
