import { MAX_SCORE } from '../config/constants.js';

/**
 * Cosine similarity between two equal-length numeric vectors.
 * Returns a value in [-1, 1]. Returns 0 for degenerate (zero-norm) vectors.
 */
export const cosineSimilarity = (a, b) => {
  if (!a || !b || a.length !== b.length) {
    throw new Error('cosineSimilarity: vectors must be equal, non-empty length');
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Converts a cosine similarity into a clamped round score.
 * CLIP image-image cosine similarity rarely drops below 0, so we clamp the
 * floor at 0 and scale to [0, 100].
 *
 * Score = max(0, similarity) * 100
 */
export const similarityToScore = (similarity) => {
  const clamped = Math.max(0, Math.min(1, similarity));
  return Math.round(clamped * MAX_SCORE);
};
