import { clipModel } from './clipModel.js';
import { cosineSimilarity, similarityToScore } from './similarity.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('scoring');

/**
 * High-level scoring API used by the worker pool. Decoupled from queue/transport
 * so it can be unit-tested and reused (e.g. by a future REST endpoint).
 */
export const scoringService = {
  /** Warms the model so the first real submission isn't penalized by load time. */
  warmup: () => clipModel.load().catch((err) => log.warn('warmup failed', err.message)),

  /** Embeds a target image once per round. */
  embedTarget: (buffer) => clipModel.embed(buffer),

  /**
   * Scores a submission against a precomputed target embedding.
   * @param {Buffer} submissionBuffer
   * @param {Float32Array} targetEmbedding
   * @returns {Promise<{ similarity: number, score: number }>}
   */
  async score(submissionBuffer, targetEmbedding) {
    const submissionEmbedding = await clipModel.embed(submissionBuffer);
    const similarity = cosineSimilarity(submissionEmbedding, targetEmbedding);
    const score = similarityToScore(similarity);
    return { similarity, score };
  },
};
