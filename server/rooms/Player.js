/**
 * A connected participant. Identity is the server-issued UUID, which survives
 * socket reconnects so session recovery can re-bind a new socket to the player.
 */
export class Player {
  constructor({ id, name, socketId }) {
    this.id = id;
    this.name = name;
    this.socketId = socketId;
    this.connected = true;
    this.totalScore = 0;
    this.joinedAt = Date.now();
    /** Tracks the previous leaderboard rank to compute movement (↑ ↓ —). */
    this.previousRank = null;
  }

  /** Serializable view safe to broadcast to all clients. */
  toPublic() {
    return {
      id: this.id,
      name: this.name,
      connected: this.connected,
    };
  }
}
