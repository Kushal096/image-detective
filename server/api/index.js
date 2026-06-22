import { Router } from 'express';
import { createRoomRoutes } from './routes/rooms.js';
import { createSubmissionRoutes } from './routes/submissions.js';

/**
 * Assembles the versioned REST API surface. Dependencies are injected so the
 * router has no hidden global state and stays testable.
 */
export const createApiRouter = (deps) => {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', rooms: deps.roomManager.count, uptime: process.uptime() });
  });

  router.use('/rooms', createRoomRoutes(deps));
  router.use('/rooms', createSubmissionRoutes(deps));

  return router;
};
