import pino from 'pino';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logLevel = process.env.LOG_LEVEL || 'info';
const logFormat = process.env.LOG_FORMAT || 'text';
const defaultLogDir = path.resolve(__dirname, '../../logs');

export function buildTransportConfig(env: NodeJS.ProcessEnv, isTTY: boolean) {
  const logDir = env.LOG_DIR || defaultLogDir;
  const logFileEnabled = env.LOG_FILE_ENABLED === 'true';

  if (logFileEnabled && !fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  return [
    {
      target: isTTY ? 'pino-pretty' : 'pino/file',
      options: isTTY ? { destination: 1, colorize: true, singleLine: true } : { destination: 1 }, // 1 is stdout
    },
    ...(logFileEnabled
      ? [
          {
            target: 'pino-roll',
            options: {
              file: path.join(logDir, 'app'),
              size: '10m', // rotate if > 10MB
              frequency: 'daily',
              extension: '.log',
              mkdir: true,
            },
          },
        ]
      : []),
  ];
}

const isTest =
  process.env.NODE_ENV === 'test' || process.env.VITEST === 'true' || !!process.env.VITEST;

const transport = isTest
  ? undefined
  : pino.transport({
      targets: buildTransportConfig(process.env, process.stdout.isTTY),
    });

export const logger = pino(
  {
    level: isTest ? 'silent' : logLevel,
  },
  transport,
);
