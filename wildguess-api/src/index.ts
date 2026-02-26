import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { db } from './database/drizzle.config.js';
import { users, sessions, rooms, roomMembers, votes } from './database/schema.js';
import { sql } from 'drizzle-orm';
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';
import voteRoutes from './routes/votes.js';

const app = new Hono();

// Configurable via environment
const PORT = parseInt(process.env.PORT || '3000', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// CORS configuration
const corsOrigins = CORS_ORIGIN === '*' ? '*' : CORS_ORIGIN.split(',').map((o) => o.trim());
app.use(
  '/api/*',
  cors({
    origin: corsOrigins as string[] | string,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

// Initialize database tables
function initDb() {
  const sqlite = (db as unknown as { $client: { exec: (sql: string) => void } }).$client;

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      expires_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      host_id TEXT NOT NULL REFERENCES users(id),
      phase TEXT NOT NULL DEFAULT 'voting',
      current_topic TEXT,
      round INTEGER NOT NULL DEFAULT 1,
      password_hash TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS room_members (
      room_id TEXT NOT NULL REFERENCES rooms(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      joined_at INTEGER NOT NULL,
      PRIMARY KEY (room_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS votes (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL REFERENCES rooms(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      round INTEGER NOT NULL,
      value TEXT,
      created_at INTEGER NOT NULL
    );
  `);

  console.log('Database initialized');
}

// Mount routes
app.route('/api/auth', authRoutes);
app.route('/api/rooms', roomRoutes);
app.route('/api/rooms', voteRoutes);

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: Date.now() });
});

// Initialize DB and start server
initDb();

serve(
  {
    fetch: app.fetch,
    port: PORT,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
