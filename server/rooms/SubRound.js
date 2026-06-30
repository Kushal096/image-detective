/**
 * A single playable sub-round within a round group. Holds the target embedding
 * (kept server-side) plus per-player submission results.
 */
export class SubRound {
  constructor({ index, durationSeconds, title = null }) {
    this.index = index;
    this.title = title;
    this.durationSeconds = durationSeconds;
    this.targetEmbedding = null;
    this.targetPreview = null;
    this.targetHint = null;
    this.hintEmbedding = null;
    this.hasTarget = false;
    this.startedAt = null;
    this.endsAt = null;
    this.status = "pending";
    this.winner = null;
    /** playerId -> { score, similarity, submittedAt, imageUrl } */
    this.submissions = new Map();
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

  remainingSeconds(now = Date.now()) {
    if (!this.endsAt) return this.durationSeconds;
    return Math.max(0, Math.ceil((this.endsAt - now) / 1000));
  }

  complete() {
    this.status = "completed";
    if (this.submissions.size > 0) {
      const sorted = [...this.submissions.entries()].sort(
        (a, b) =>
          b[1].score - a[1].score || a[1].submittedAt - b[1].submittedAt,
      );
      this.winner = sorted[0][0];
    }
  }

  toHostPublic() {
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
