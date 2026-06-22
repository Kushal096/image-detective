import multer from 'multer';
import { createLogger } from '../utils/logger.js';

const log = createLogger('http');

/** 404 handler for unmatched routes. */
export const notFound = (_req, res) => {
  res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
};

/** Centralized error handler. Maps known error types to safe responses. */
// eslint-disable-next-line no-unused-vars -- Express requires the 4-arg signature
export const errorHandler = (err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({ error: err.message, code: err.code });
  }
  if (err?.status) {
    return res.status(err.status).json({ error: err.message, code: err.name });
  }
  log.error('unhandled error', err?.message ?? String(err));
  return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL' });
};
