import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

/**
 * Composes the security middleware stack. Applied globally in server.js before
 * any route handlers.
 */
export const securityMiddleware = () => [
  helmet({
    // CSP is largely irrelevant for a JSON/Socket API; the SPA sets its own.
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
  cors({
    origin: env.clientOrigin,
    methods: ['GET', 'POST'],
    credentials: false,
  }),
];

/** Generic API limiter to blunt floods and abuse. */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, slow down', code: 'RATE_LIMITED' },
});

/** Stricter limiter for expensive upload/scoring routes. */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many uploads, slow down', code: 'UPLOAD_RATE_LIMITED' },
});

/** Limits room creation to deter automated room spam. */
export const roomCreationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many rooms created, slow down', code: 'ROOM_RATE_LIMITED' },
});
