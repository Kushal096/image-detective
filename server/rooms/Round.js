/**
 * A single round. Holds the target embedding (kept server-side, never sent to
 * players) plus per-player submission results. The full target preview is
 * host-only; players receive a blurred/cropped hint.
 */
export class Round {
  constructor({ index, durationSeconds, title = null }) {
    this.index = index;
    this.title = title;
    this.durationSeconds = durationSeconds;
    this.targetEmbedding = null; // Float32Array, server-only
    this.targetPreview = null; // full data URL, host-only
    this.targetHint = null; // blurred/cropped data URL for players
    this.hintEmbedding = null; // Float32Array of clue image, server-only
    this.hasTarget = false;
    this.startedAt = null;
    this.endsAt = null;
    this.status = 'pending'; // pending, active, completed
    this.winner = null; // playerId of winner
    /** playerId -> { score, similarity, submittedAt, imageUrl } */
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

  recordSubmission(playerId, { score, similarity, imageUrl = null }) {
    this.pending.delete(playerId);
    this.submissions.set(playerId, {
      score,
      similarity,
      imageUrl,
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

  /** Mark round as completed and determine winner. */
  complete() {
    this.status = 'completed';
    if (this.submissions.size > 0) {
      const sorted = [...this.submissions.entries()].sort(
        (a, b) => b[1].score - a[1].score || a[1].submittedAt - b[1].submittedAt
      );
      this.winner = sorted[0][0];
    }
  }

  /** Returns public-safe round info for host. */
  toHostPublic() {
    // Convert Map to object for JSON serialization
    const submissions = {};
    for (const [playerId, submission] of this.submissions.entries()) {
      submissions[playerId] = submission;
    }
    
    return {
      index: this.index,
      title: this.title,
      hasTarget: this.hasTarget,
      targetPreview: this.targetPreview,
      status: this.status,
      winner: this.winner,
      submissionCount: this.submissions.size,
      submissions,
    };
  }
}
