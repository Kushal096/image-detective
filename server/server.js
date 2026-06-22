import express from 'express';
import { createServer } from 'node:http';
import { Server as SocketServer } from 'socket.io';

import { env } from './config/env.js';
import { createLogger } from './utils/logger.js';

import { securityMiddleware, apiLimiter, roomCreationLimiter } from './middleware/security.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { createApiRouter } from './api/index.js';

import { roomManager } from './rooms/RoomManager.js';
import { timerManager } from './rooms/TimerManager.js';
import { SubmissionQueue } from './queue/SubmissionQueue.js';
import { WorkerPool } from './workers/WorkerPool.js';
import { Broadcaster } from './sockets/Broadcaster.js';
import { GameService } from './services/GameService.js';
import { scoringService } from './ai/scoringService.js';
import { createPersistenceStore } from './services/persistence/index.js';

import { SocketEvents } from './config/constants.js';
import { registerHostHandlers } from './sockets/handlers/host.js';
import { registerPlayerHandlers } from './sockets/handlers/player.js';

const log = createLogger('server');

/**
 * Composition root. Builds the dependency graph explicitly so wiring is visible
 * in one place and every component receives its collaborators via injection.
 */
const bootstrap = async () => {
  const store = await createPersistenceStore();
  const queue = new SubmissionQueue();

  // Broadcaster needs `io`, which needs the HTTP server. We create it with a
  // late-bound io reference to break the otherwise-circular wiring.
  const broadcaster = new Broadcaster(null);

  const gameService = new GameService({
    roomManager,
    timerManager,
    queue,
    broadcaster,
    scoringService,
    store,
  });

  // ── Express app ─────────────────────────────────────
  const app = express();
  app.disable('x-powered-by');
  app.use(...securityMiddleware());
  app.use(express.json({ limit: '64kb' }));
  app.use('/api', apiLimiter);
  // Room creation happens over sockets, but guard the REST surface broadly too.
  app.use('/api/rooms', roomCreationLimiter);
  app.use('/api', createApiRouter({ roomManager, gameService, scoringService }));
  app.use(notFound);
  app.use(errorHandler);

  // ── HTTP + Socket.IO ────────────────────────────────
  const httpServer = createServer(app);
  const io = new SocketServer(httpServer, {
    cors: { origin: env.clientOrigin, methods: ['GET', 'POST'] },
    connectionStateRecovery: { maxDisconnectionDuration: 2 * 60 * 1000 },
  });
  broadcaster.io = io;

  io.on(SocketEvents.CONNECTION, (socket) => {
    registerHostHandlers({ socket, gameService, roomManager, broadcaster });
    registerPlayerHandlers({ socket, gameService, roomManager, broadcaster });
    socket.on(SocketEvents.DISCONNECT, () => gameService.handleDisconnect(socket.id));
  });

  // ── AI worker pool ──────────────────────────────────
  const pool = new WorkerPool({
    queue,
    processor: gameService.processSubmission,
    concurrency: env.ai.workerConcurrency,
  });
  pool.start();
  scoringService.warmup();

  // ── Idle room reaper ────────────────────────────────
  const reaper = setInterval(() => {
    roomManager.reapIdle().forEach((code) => timerManager.clear(code));
  }, 60 * 1000);

  // ── Listen ──────────────────────────────────────────
  httpServer.listen(env.port, () => {
    log.info(`Internet Detective server listening on :${env.port}`, {
      env: env.nodeEnv,
      origin: env.clientOrigin,
      aiMock: env.ai.mock,
    });
  });

  // ── Graceful shutdown ───────────────────────────────
  const shutdown = async (signal) => {
    log.info(`received ${signal}, shutting down`);
    clearInterval(reaper);
    timerManager.clearAll();
    await pool.stop();
    io.close();
    httpServer.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

bootstrap().catch((err) => {
  log.error('fatal bootstrap error', err.stack ?? err.message);
  process.exit(1);
});
