import { describe, it, expect, vi, afterEach } from 'vitest';
import { buildTransportConfig } from './logger.js';
import fs from 'fs';
import path from 'path';

// Mock fs to prevent actual directory creation during test suites
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
  },
}));

describe('Logger Transport Configuration', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Dev Mode (isTTY = true)', () => {
    it('should configure pino-pretty for stdout when isTTY is true', () => {
      const config = buildTransportConfig({}, true);

      expect(config[0]).toEqual({
        target: 'pino-pretty',
        options: { destination: 1, colorize: true },
      });
    });
  });

  describe('Production Mode (isTTY = false)', () => {
    it('should configure pino/file for stdout when isTTY is false', () => {
      const config = buildTransportConfig({}, false);

      expect(config[0]).toEqual({
        target: 'pino/file',
        options: { destination: 1 },
      });
    });
  });

  describe('File Logging (LOG_FILE_ENABLED)', () => {
    it('should configure pino-roll when LOG_FILE_ENABLED is true', () => {
      const config = buildTransportConfig({ LOG_FILE_ENABLED: 'true' }, false);

      expect(config.length).toBe(2);
      expect(config[1].target).toBe('pino-roll');
      expect(config[1].options).toMatchObject({
        frequency: 'daily',
        size: '10m',
        extension: '.log',
        mkdir: true,
      });
    });

    it('should NOT configure pino-roll when LOG_FILE_ENABLED is undefined or false', () => {
      let config = buildTransportConfig({}, false);
      expect(config.length).toBe(1);
      expect(config.some((t) => t.target === 'pino-roll')).toBe(false);

      config = buildTransportConfig({ LOG_FILE_ENABLED: 'false' }, false);
      expect(config.length).toBe(1);
      expect(config.some((t) => t.target === 'pino-roll')).toBe(false);
    });

    it('should respect custom LOG_DIR', () => {
      const customDir = '/custom/test/log/path';
      const config = buildTransportConfig({ LOG_FILE_ENABLED: 'true', LOG_DIR: customDir }, false);

      expect(config[1].options.file).toBe(path.join(customDir, 'app'));
    });
  });
});
