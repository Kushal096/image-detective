import { Router } from "express";
import { uploadSingleImage } from "../../middleware/upload.js";
import { uploadLimiter } from "../../middleware/security.js";
import {
  inspectImage,
  makePlayerHint,
  makePreviewDataUrl,
} from "../../ai/imageProcessor.js";
import { normalizeRoomCode } from "../../utils/validation.js";
import { parseHintConfig } from "../../utils/hintConfig.js";
import { createLogger } from "../../utils/logger.js";
import sharp from "sharp";

const log = createLogger("api:rooms");

/**
 * Room-scoped REST routes. The Host uploads target images here (binary uploads
 * belong on REST, not sockets). Host identity is proven with the x-host-id
 * token issued at room creation.
 */
export const createRoomRoutes = ({
  roomManager,
  gameService,
  scoringService,
}) => {
  const router = Router();

  // Lightweight existence check used by the join screen.
  router.get("/:code/exists", (req, res) => {
    const room = roomManager.getRoom(normalizeRoomCode(req.params.code));
    res.json({
      exists: Boolean(room),
      open: room ? room.state === "WAITING_ROOM" : false,
    });
  });

  // Host uploads / replaces the target image for a specific round or upcoming round.
  router.post("/:code/target", uploadLimiter, (req, res, next) => {
    uploadSingleImage(req, res, async (uploadErr) => {
      if (uploadErr) return next(uploadErr);
      try {
        const code = normalizeRoomCode(req.params.code);
        const room = roomManager.getRoom(code);
        if (!room)
          return res
            .status(404)
            .json({ error: "Room not found", code: "NOT_FOUND" });

        const hostId = req.get("x-host-id");
        if (!hostId || hostId !== room.hostId) {
          return res
            .status(403)
            .json({ error: "Host authorization required", code: "FORBIDDEN" });
        }
        if (!req.file) {
          return res
            .status(400)
            .json({ error: "No image provided", code: "NO_FILE" });
        }

        const check = await inspectImage(req.file.buffer);
        if (!check.ok) {
          return res
            .status(415)
            .json({ error: check.reason, code: "BAD_IMAGE" });
        }

        const { width = 1, height = 1 } = await sharp(req.file.buffer)
          .rotate()
          .metadata();
        const hintConfig = parseHintConfig(req.body?.hintConfig, width, height);

        const hint = await makePlayerHint(req.file.buffer, hintConfig);

        const [embedding, preview, hintEmbedding] = await Promise.all([
          scoringService.embedTarget(req.file.buffer),
          makePreviewDataUrl(req.file.buffer),
          scoringService.embedHint(hint.buffer),
        ]);

        // Support roundIndex + subRoundIndex for tournament mode
        const roundIndex =
          req.body.roundIndex !== undefined
            ? parseInt(req.body.roundIndex, 10)
            : undefined;
        const subRoundIndex =
          req.body.subRoundIndex !== undefined
            ? parseInt(req.body.subRoundIndex, 10)
            : undefined;

        const result = await gameService.setTarget({
          room,
          roundIndex,
          subRoundIndex,
          embedding,
          previewDataUrl: preview,
          hintDataUrl: hint.dataUrl,
          hintEmbedding,
        });

        if (result.error) {
          return res.status(400).json(result);
        }

        log.info("target set", { code, roundIndex });
        res.json({ ok: true });
      } catch (err) {
        next(err);
      }
    });
  });

  return router;
};
