import { Router } from 'express';
import { uploadSingleImage } from '../../middleware/upload.js';
import { uploadLimiter } from '../../middleware/security.js';
import { inspectImage } from '../../ai/imageProcessor.js';
import { normalizeRoomCode } from '../../utils/validation.js';

/**
 * Player submission route. Validates the player + image, then hands the buffer
 * to GameService which enqueues it for asynchronous AI scoring. Responds 202
 * immediately so the request never waits on inference.
 */
export const createSubmissionRoutes = ({ roomManager, gameService }) => {
  const router = Router();

  router.post('/:code/submit', uploadLimiter, (req, res, next) => {
    uploadSingleImage(req, res, async (uploadErr) => {
      if (uploadErr) return next(uploadErr);
      try {
        const code = normalizeRoomCode(req.params.code);
        const room = roomManager.getRoom(code);
        if (!room) return res.status(404).json({ error: 'Room not found', code: 'NOT_FOUND' });

        const playerId = req.get('x-player-id');
        const player = playerId ? room.getPlayer(playerId) : null;
        if (!player) {
          return res.status(403).json({ error: 'Unknown player session', code: 'NO_SESSION' });
        }
        if (!req.file) {
          return res.status(400).json({ error: 'No image provided', code: 'NO_FILE' });
        }

        const check = await inspectImage(req.file.buffer);
        if (!check.ok) {
          return res.status(415).json({ error: check.reason, code: 'BAD_IMAGE' });
        }

        const result = gameService.enqueueSubmission({ room, player, buffer: req.file.buffer });
        if (result.error) {
          return res.status(409).json({ error: result.error, code: result.code });
        }

        res.status(202).json({ queued: true, queueSize: result.queueSize });
      } catch (err) {
        next(err);
      }
    });
  });

  return router;
};
