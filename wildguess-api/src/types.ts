import type { Env } from 'hono';

/**
 * Hono environment type with auth variables available after auth middleware.
 */
export interface AppEnv extends Env {
    Variables: {
        userId: string;
    };
}
