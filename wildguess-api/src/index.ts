import { serve } from '@hono/node-server';
import { db } from './database/drizzle.config.js';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import app from './app.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurable via environment
const PORT = parseInt(process.env.PORT || '3000', 10);

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

serve(
  {
    fetch: app.fetch,
    port: PORT,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
