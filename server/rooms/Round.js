/**
 * A single round. Holds the target embedding (kept server-side, never sent to
 * players) plus per-player submission results. The full target preview is
 * host-only; players receive a blurred/cropped hint.
 */
export class Round {
  constructor({ index, durationSeconds }) {
    this.index = index;
    this.durationSeconds = durationSeconds;
    this.targetEmbedding = null; // Float32Array, server-only
    this.targetPreview = null; // full data URL, host-only
    this.targetHint = null; // blurred/cropped data URL for players
    this.hintEmbedding = null; // Float32Array of clue image, server-only
    this.hasTarget = false;
    this.startedAt = null;
    this.endsAt = null;
    /** playerId -> { score, similarity, submittedAt } */
    this.submissions = new Map();
    /** playerIds whose submission is enqueued/being scored (locks duplicates). */
    this.pending = new Set();
  }

  setTarget(embedding, previewDataUrl, hintDataUrl, hintEmbedding) {
    this.targetEmbedding = embedding;
    this.targetPreview = previewDataUrl;
    this.targetHint = hintDataUrl;
    this.hintEmbedding = hintEmbedding;
    this.hasTarget = true;
  }

  start(now = Date.now()) {
    this.startedAt = now;
    this.endsAt = now + this.durationSeconds * 1000;
  }

  hasSubmitted(playerId) {
    return this.submissions.has(playerId) || this.pending.has(playerId);
  }

  lockPending(playerId) {
    this.pending.add(playerId);
  }

  recordSubmission(playerId, { score, similarity }) {
    this.pending.delete(playerId);
    this.submissions.set(playerId, {
      score,
      similarity,
      submittedAt: Date.now(),
    });
  }

  releasePending(playerId) {
    this.pending.delete(playerId);
  }

  get isProcessingComplete() {
    return this.pending.size === 0;
  }

  /** Seconds remaining, never negative. */
  remainingSeconds(now = Date.now()) {
    if (!this.endsAt) return this.durationSeconds;
    return Math.max(0, Math.ceil((this.endsAt - now) / 1000));
  }
}
