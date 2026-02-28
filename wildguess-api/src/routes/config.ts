import { Hono } from 'hono';

const configRoutes = new Hono();

configRoutes.get('/', (c) => {
  const pollingRate = parseInt(process.env.POLLING_RATE_MS || '2000', 10);
  return c.json({ pollingRate });
});

export default configRoutes;
