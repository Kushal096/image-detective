import { GameState } from "../config/constants.js";
import { Player } from "./Player.js";
import { Round } from "./Round.js";

/**
 * Authoritative room aggregate. Owns the game state machine, the player roster,
 * and round history. Pure domain logic only — no transport or timers here, so
 * it stays unit-testable. Orchestration lives in GameService.
 */
export class Room {
  constructor({ code, hostId, roundSeconds, totalRounds = 5 }) {
    this.code = code;
    this.hostId = hostId; // secret host session token
    this.hostSocketId = null;
    this.state = GameState.WAITING_ROOM;
    this.roundSeconds = roundSeconds;
    this.totalRounds = totalRounds;
    this.players = new Map(); // playerId -> Player
    this.rounds = []; // Round[]
    this.currentRoundIndex = -1;
    this.createdAt = Date.now();
    this.lastActivity = Date.now();
  }

  touch() {
    this.lastActivity = Date.now();
  }

  get currentRound() {
    return this.rounds[this.currentRoundIndex] ?? null;
  }

  get playerCount() {
    return this.players.size;
  }

  // ── Players ───────────────────────────────────────────
  addPlayer({ id, name, socketId }) {
    const player = new Player({ id, name, socketId });
    this.players.set(id, player);
    this.touch();
    return player;
  }

  getPlayer(id) {
    return this.players.get(id) ?? null;
  }

  removePlayer(id) {
    this.players.delete(id);
    this.touch();
  }

  hasName(name) {
    const lowered = name.toLowerCase();
    return [...this.players.values()].some(
      (p) => p.name.toLowerCase() === lowered,
    );
  }

  // ── Rounds / state machine ────────────────────────────
  createNextRound() {
    const round = new Round({
      index: this.rounds.length,
      durationSeconds: this.roundSeconds,
    });
    this.rounds.push(round);
    this.currentRoundIndex = round.index;
    this.touch();
    return round;
  }

  setState(next) {
    this.state = next;
    this.touch();
  }

  get isLastRound() {
    return this.currentRoundIndex >= this.totalRounds - 1;
  }

  /**
   * Leaderboard sorted by total score desc, with stable movement indicators
   * derived from each player's previous rank.
   */
  leaderboard() {
    const sorted = [...this.players.values()].sort(
      (a, b) => b.totalScore - a.totalScore || a.joinedAt - b.joinedAt,
    );

    const entries = sorted.map((player, idx) => {
      const rank = idx + 1;
      const movement =
        player.previousRank === null
          ? "same"
          : player.previousRank > rank
            ? "up"
            : player.previousRank < rank
              ? "down"
              : "same";
      const round = this.currentRound;
      const roundResult = round ? round.submissions.get(player.id) : null;
      return {
        rank,
        playerId: player.id,
        name: player.name,
        totalScore: player.totalScore,
        roundScore: roundResult?.score ?? null,
        movement,
        connected: player.connected,
      };
    });

    return entries;
  }

  /** Snapshots current ranks so the next leaderboard can show movement. */
  commitRanks() {
    this.leaderboard().forEach((entry) => {
      const player = this.players.get(entry.playerId);
      if (player) player.previousRank = entry.rank;
    });
  }

  /** Client-safe room snapshot. Host-only fields are added by the caller. */
  toPublic() {
    const round = this.currentRound;
    const hintVisible = PLAYER_HINT_VISIBLE_STATES.has(this.state);
    return {
      code: this.code,
      state: this.state,
      roundSeconds: this.roundSeconds,
      totalRounds: this.totalRounds,
      currentRound: this.currentRoundIndex + 1,
      hasTarget: round?.hasTarget ?? false,
      targetHint: hintVisible ? (round?.targetHint ?? null) : null,
      remainingSeconds: round ? round.remainingSeconds() : this.roundSeconds,
      players: [...this.players.values()].map((p) => p.toPublic()),
      leaderboard: this.leaderboard(),
    };
  }
}

/** Player hint is revealed only after the host starts the round. */
const PLAYER_HINT_VISIBLE_STATES = new Set([
  GameState.ROUND_STARTING,
  GameState.SEARCHING,
  GameState.SUBMISSIONS_CLOSED,
  GameState.AI_PROCESSING,
]);
