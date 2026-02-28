import { serve } from '@hono/node-server';
import { db } from './database/drizzle.config.js';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import app from './app.js';
import { fileURLToPath } from 'url';
import path from 'path';
import { purgeTimedOutUsers } from './utils/room-purge.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurable via environment
const PORT = parseInt(process.env.PORT || '3000', 10);
const POLLING_RATE_MS = parseInt(process.env.POLLING_RATE_MS || '3000', 10);
const ROOM_TIMEOUT_MS = parseInt(process.env.ROOM_TIMEOUT_MS || '30000', 10);

if (POLLING_RATE_MS >= ROOM_TIMEOUT_MS) {
  console.error(
    `Configuration Error: POLLING_RATE_MS (${POLLING_RATE_MS}ms) must be strictly less than ROOM_TIMEOUT_MS (${ROOM_TIMEOUT_MS}ms).`,
  );
  process.exit(1);
}

// Initialize database tables via Drizzle migrations
function initDb() {
  try {
    // Resolve the path to the migrations folder based on where we are executing from (dist or src)
    const migrationsFolder = path.resolve(__dirname, '../drizzle');
    migrate(db, { migrationsFolder });
    console.log('Database initialized from migrations');
  } catch (error) {
    console.error('Failed to run database migrations:', error);
    process.exit(1);
  }
}

// Initialize DB and start server
initDb();

// Start background task to purge inactive users
setInterval(
  () => {
    purgeTimedOutUsers(ROOM_TIMEOUT_MS);
  },
  Math.max(1000, Math.floor(ROOM_TIMEOUT_MS / 4)),
); // Check fairly often relative to timeout

serve(
  {
    fetch: app.fetch,
    port: PORT,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
