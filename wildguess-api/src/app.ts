import { Hono } from 'hono';
import { cors } from 'hono/cors';
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';
import voteRoutes from './routes/votes.js';
import configRoutes from './routes/config.js';

const app = new Hono();

// Configurable via environment
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

// Mount routes
app.route('/api/auth', authRoutes);
app.route('/api/rooms', roomRoutes);
app.route('/api/rooms', voteRoutes);
app.route('/api/config', configRoutes);

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: Date.now() });
});

export default app;
