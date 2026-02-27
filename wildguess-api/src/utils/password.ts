import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(':');
    if (!salt || !hash) return false;

    const buf = Buffer.from(hash, 'hex');
    const attempt = scryptSync(password, salt, 64);

    // Check if the buffers are the same length before timingSafeEqual to avoid errors
    if (buf.length !== attempt.length) return false;

    return timingSafeEqual(buf, attempt);
  } catch (error) {
    return false;
  }
}
