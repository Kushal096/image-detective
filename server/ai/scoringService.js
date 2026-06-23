import { clipModel } from "./clipModel.js";
import {
  cosineSimilarity,
  isHintReuse,
  similarityToScore,
} from "./similarity.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("scoring");

/**
 * High-level scoring API used by the worker pool. Decoupled from queue/transport
 * so it can be unit-tested and reused (e.g. by a future REST endpoint).
 */
export const scoringService = {
  /** Warms the model so the first real submission isn't penalized by load time. */
  warmup: () =>
    clipModel.warmup().catch((err) => log.warn("warmup failed", err.message)),

  /** Embeds a target image once per round. */
  embedTarget: (buffer) => clipModel.embed(buffer),

  /** Embeds the exact clue image shown to players (for anti-cheat). */
  embedHint: (buffer) => clipModel.embed(buffer),

  /**
   * Scores a submission against a precomputed target embedding.
   * @param {Buffer} submissionBuffer
   * @param {Float32Array} targetEmbedding
   * @param {Float32Array|null} hintEmbedding
   * @returns {Promise<{ similarity: number, score: number, hintReuse?: boolean }>}
   */
  async score(submissionBuffer, targetEmbedding, hintEmbedding = null) {
    const submissionEmbedding = await clipModel.embed(submissionBuffer);
    const similarity = cosineSimilarity(submissionEmbedding, targetEmbedding);

    if (hintEmbedding) {
      const hintSimilarity = cosineSimilarity(
        submissionEmbedding,
        hintEmbedding,
      );
      if (isHintReuse(hintSimilarity, similarity)) {
        log.info("hint reuse detected", {
          hintSimilarity: hintSimilarity.toFixed(3),
          targetSimilarity: similarity.toFixed(3),
        });
        return { similarity, score: 0, hintReuse: true };
      }
    }

    const score = similarityToScore(similarity);
    return { similarity, score };
  },
};
