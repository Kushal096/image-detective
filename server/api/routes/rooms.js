import { Router } from 'express';
import { uploadSingleImage } from '../../middleware/upload.js';
import { uploadLimiter } from '../../middleware/security.js';
import { inspectImage, makePreviewDataUrl } from '../../ai/imageProcessor.js';
import { normalizeRoomCode } from '../../utils/validation.js';
import { createLogger } from '../../utils/logger.js';

const log = createLogger('api:rooms');

/**
 * Room-scoped REST routes. The Host uploads target images here (binary uploads
 * belong on REST, not sockets). Host identity is proven with the x-host-id
 * token issued at room creation.
 */
export const createRoomRoutes = ({ roomManager, gameService, scoringService }) => {
  const router = Router();

  // Lightweight existence check used by the join screen.
  router.get('/:code/exists', (req, res) => {
    const room = roomManager.getRoom(normalizeRoomCode(req.params.code));
    res.json({ exists: Boolean(room), open: room ? room.state === 'WAITING_ROOM' : false });
  });

  // Host uploads / replaces the target image for the upcoming round.
  router.post('/:code/target', uploadLimiter, (req, res, next) => {
    uploadSingleImage(req, res, async (uploadErr) => {
      if (uploadErr) return next(uploadErr);
      try {
        const code = normalizeRoomCode(req.params.code);
        const room = roomManager.getRoom(code);
        if (!room) return res.status(404).json({ error: 'Room not found', code: 'NOT_FOUND' });

        const hostId = req.get('x-host-id');
        if (!hostId || hostId !== room.hostId) {
          return res.status(403).json({ error: 'Host authorization required', code: 'FORBIDDEN' });
        }
        if (!req.file) {
          return res.status(400).json({ error: 'No image provided', code: 'NO_FILE' });
        }

        const check = await inspectImage(req.file.buffer);
        if (!check.ok) {
          return res.status(415).json({ error: check.reason, code: 'BAD_IMAGE' });
        }

        const [embedding, preview] = await Promise.all([
          scoringService.embedTarget(req.file.buffer),
          makePreviewDataUrl(req.file.buffer),
        ]);
        await gameService.setTarget({ room, embedding, previewDataUrl: preview });

        log.info('target set', { code });
        res.json({ ok: true });
      } catch (err) {
        next(err);
      }
    });
  });

  return router;
};
