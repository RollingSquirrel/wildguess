import type { MiddlewareHandler } from 'hono';
import { logger } from '../utils/logger.js';

export const apiLogger = (): MiddlewareHandler => {
  return async (c, next) => {
    const start = Date.now();
    await next();
    const durationMs = Date.now() - start;
    logger.info(
      {
        method: c.req.method,
        url: c.req.url,
        status: c.res.status,
        durationMs,
      },
      'API Request',
    );
  };
};
