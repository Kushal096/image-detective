import { env } from '../config/env.js';

/**
 * Minimal structured logger. Avoids pulling a heavy logging dependency while
 * keeping a single choke point we can later swap for pino/winston.
 */
const levels = { debug: 10, info: 20, warn: 30, error: 40 };
const threshold = env.isProduction ? levels.info : levels.debug;

const format = (level, scope, message, meta) => {
  const ts = new Date().toISOString();
  const base = `[${ts}] ${level.toUpperCase().padEnd(5)} ${scope ? `(${scope}) ` : ''}${message}`;
  return meta !== undefined ? `${base} ${safeStringify(meta)}` : base;
};

const safeStringify = (meta) => {
  try {
    return typeof meta === 'string' ? meta : JSON.stringify(meta);
  } catch {
    return String(meta);
  }
};

const log = (level, scope, message, meta) => {
  if (levels[level] < threshold) return;
  const line = format(level, scope, message, meta);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
};

export const createLogger = (scope) => ({
  debug: (msg, meta) => log('debug', scope, msg, meta),
  info: (msg, meta) => log('info', scope, msg, meta),
  warn: (msg, meta) => log('warn', scope, msg, meta),
  error: (msg, meta) => log('error', scope, msg, meta),
});

export const logger = createLogger('app');
