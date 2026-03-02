import type { ErrorHandler } from 'hono';
import { logger } from '../utils/logger.js';

export const errorHandler: ErrorHandler = (err, c) => {
  logger.error(
    {
      err: {
        message: err.message,
        stack: err.stack,
      },
      method: c.req.method,
      url: c.req.url,
    },
    'Unhandled Application Error',
  );

  return c.json({ error: 'Internal Server Error' }, 500);
};
