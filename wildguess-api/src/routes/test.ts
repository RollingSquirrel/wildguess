import { Hono } from 'hono';
import { db } from '../database/drizzle.config.js';
import { votes, roomMembers, rooms, sessions, users } from '../database/schema.js';
import { PresenceStore } from '../utils/presence.js';
import { logger } from '../utils/logger.js';

const testRoutes = new Hono();

/**
 * POST /api/test/reset-db
 *
 * Deletes all rows from every table and clears the in-memory PresenceStore.
 * Only mounted when ENABLE_TEST_ROUTES=true — never available in production.
 */
testRoutes.post('/reset-db', (c) => {
  // Delete in FK-safe order (children before parents)
  db.delete(votes).run();
  db.delete(roomMembers).run();
  db.delete(rooms).run();
  db.delete(sessions).run();
  db.delete(users).run();
  PresenceStore.clear();

  logger.warn('Test route: database reset');
  return c.json({ success: true });
});

export default testRoutes;
