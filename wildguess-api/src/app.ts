import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { apiLogger } from './middleware/logger.js';
import { errorHandler } from './middleware/error-handler.js';
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';
import voteRoutes from './routes/votes.js';
import configRoutes from './routes/config.js';
import testRoutes from './routes/test.js';

const app = new Hono();

app.use('*', apiLogger());
app.onError(errorHandler);

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

// Test-only routes — only mounted when ENABLE_TEST_ROUTES=true
if (process.env.ENABLE_TEST_ROUTES === 'true') {
  app.route('/api/test', testRoutes);
  // eslint-disable-next-line no-console
  console.warn(
    '[WARNING] ENABLE_TEST_ROUTES is active — test routes are exposed. Do NOT use in production.',
  );
}

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: Date.now() });
});

export default app;
