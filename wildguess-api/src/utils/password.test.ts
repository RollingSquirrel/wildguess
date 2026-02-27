import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password.js';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should generate a string with a salt and a hash separated by a colon', () => {
      const result = hashPassword('my-secret-password');
      expect(result).toBeTypeOf('string');
      expect(result).toContain(':');
      
      const parts = result.split(':');
      expect(parts.length).toBe(2);
      expect(parts[0].length).toBeGreaterThan(0); // Salt
      expect(parts[1].length).toBeGreaterThan(0); // Hash
    });

    it('should generate different hashes for the same password due to random salting', () => {
      const hash1 = hashPassword('same-password');
      const hash2 = hashPassword('same-password');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for a correct password', () => {
      const originalPassword = 'correct-horse-battery-staple';
      const storedHash = hashPassword(originalPassword);
      
      expect(verifyPassword(originalPassword, storedHash)).toBe(true);
    });

    it('should return false for an incorrect password', () => {
      const storedHash = hashPassword('real-password');
      expect(verifyPassword('wrong-password', storedHash)).toBe(false);
    });

    it('should return false for malformed stored hashes', () => {
      expect(verifyPassword('password', 'no-colon-here')).toBe(false);
      expect(verifyPassword('password', ':only-hash')).toBe(false);
      expect(verifyPassword('password', 'only-salt:')).toBe(false);
      expect(verifyPassword('password', '')).toBe(false);
    });
  });
});
