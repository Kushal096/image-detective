import { GameState } from "../config/constants.js";
import { Player } from "./Player.js";
import { RoundGroup } from "./RoundGroup.js";

/**
 * Authoritative room aggregate. Owns the game state machine, the player roster,
 * and round history. Pure domain logic only — no transport or timers here, so
 * it stays unit-testable. Orchestration lives in GameService.
 */
export class Room {
  constructor({ code, hostId, roundSeconds, totalRounds = 5 }) {
    this.code = code;
    this.hostId = hostId;
    this.hostSocketId = null;
    this.state = GameState.WAITING_ROOM;
    this.roundSeconds = roundSeconds;
    this.totalRounds = totalRounds;
    this.players = new Map();
    /** @type {RoundGroup[]} */
    this.rounds = [];
    /** Flat index into all sub-rounds across all round groups. */
    this.currentRoundIndex = -1;
    this.gameStarted = false;
    this.createdAt = Date.now();
    this.lastActivity = Date.now();
  }

  touch() {
    this.lastActivity = Date.now();
  }

  /** All sub-rounds flattened in play order. */
  flatSubRounds() {
    return this.rounds.flatMap((group) =>
      group.subRounds.map((sr) => ({ group, subRound: sr })),
    );
  }

  get currentRoundEntry() {
    const flat = this.flatSubRounds();
    return flat[this.currentRoundIndex] ?? null;
  }

  /** The currently active sub-round (playable unit). */
  get currentRound() {
    return this.currentRoundEntry?.subRound ?? null;
  }

  get currentRoundGroup() {
    return this.currentRoundEntry?.group ?? null;
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

  getPlayerByName(name) {
    const lowered = name.toLowerCase();
    return (
      [...this.players.values()].find(
        (p) => p.name.toLowerCase() === lowered,
      ) ?? null
    );
  }

  removePlayer(id) {
    this.players.delete(id);
    this.touch();
  }

  hasName(name) {
    return Boolean(this.getPlayerByName(name));
  }

  // ── Round groups / sub-rounds ───────────────────────────
  createNextRound() {
    const group = new RoundGroup({
      index: this.rounds.length,
      durationSeconds: this.roundSeconds,
    });
    group.addSubRound({ title: "Sub-round 1" });
    this.rounds.push(group);
    this.currentRoundIndex = this.flatSubRounds().length - 1;
    this.touch();
    return group.subRounds[0];
  }

  addRound({ title = null } = {}) {
    if (this.gameStarted) {
      return {
        error: "Cannot add rounds after game starts",
        code: "GAME_STARTED",
      };
    }
    const group = new RoundGroup({
      index: this.rounds.length,
      title,
      durationSeconds: this.roundSeconds,
    });
    group.addSubRound({ title: "Sub-round 1" });
    this.rounds.push(group);
    this.totalRounds = this.flatSubRounds().length;
    this.touch();
    return { round: group };
  }

  removeRound(index) {
    if (this.gameStarted) {
      return {
        error: "Cannot remove rounds after game starts",
        code: "GAME_STARTED",
      };
    }
    if (index < 0 || index >= this.rounds.length) {
      return { error: "Invalid round index", code: "INVALID_INDEX" };
    }
    this.rounds.splice(index, 1);
    this.rounds.forEach((g, i) => (g.index = i));
    this.totalRounds = this.flatSubRounds().length;
    this.touch();
    return { ok: true };
  }

  updateRound(index, { title }) {
    if (this.gameStarted) {
      return {
        error: "Cannot update rounds after game starts",
        code: "GAME_STARTED",
      };
    }
    const group = this.rounds[index];
    if (!group) {
      return { error: "Round not found", code: "NOT_FOUND" };
    }
    if (title !== undefined) group.title = title;
    this.touch();
    return { round: group };
  }

  reorderRounds(newOrder) {
    if (this.gameStarted) {
      return {
        error: "Cannot reorder rounds after game starts",
        code: "GAME_STARTED",
      };
    }
    if (!Array.isArray(newOrder) || newOrder.length !== this.rounds.length) {
      return { error: "Invalid reorder array", code: "INVALID_ORDER" };
    }
    const reordered = newOrder.map((idx) => this.rounds[idx]).filter(Boolean);
    if (reordered.length !== this.rounds.length) {
      return { error: "Invalid reorder indices", code: "INVALID_ORDER" };
    }
    this.rounds = reordered;
    this.rounds.forEach((g, i) => (g.index = i));
    this.touch();
    return { ok: true };
  }

  addSubRound(groupIndex, { title = null } = {}) {
    if (this.gameStarted) {
      return {
        error: "Cannot add sub-rounds after game starts",
        code: "GAME_STARTED",
      };
    }
    const group = this.rounds[groupIndex];
    if (!group) {
      return { error: "Round group not found", code: "NOT_FOUND" };
    }
    const subRound = group.addSubRound({ title });
    this.totalRounds = this.flatSubRounds().length;
    this.touch();
    return { subRound };
  }

  removeSubRound(groupIndex, subRoundIndex) {
    if (this.gameStarted) {
      return {
        error: "Cannot remove sub-rounds after game starts",
        code: "GAME_STARTED",
      };
    }
    const group = this.rounds[groupIndex];
    if (!group) {
      return { error: "Round group not found", code: "NOT_FOUND" };
    }
    if (group.subRounds.length <= 1) {
      return {
        error: "Round must have at least one sub-round",
        code: "MIN_SUBROUNDS",
      };
    }
    if (!group.removeSubRound(subRoundIndex)) {
      return { error: "Invalid sub-round index", code: "INVALID_INDEX" };
    }
    this.totalRounds = this.flatSubRounds().length;
    this.touch();
    return { ok: true };
  }

  updateSubRound(groupIndex, subRoundIndex, { title }) {
    if (this.gameStarted) {
      return {
        error: "Cannot update sub-rounds after game starts",
        code: "GAME_STARTED",
      };
    }
    const group = this.rounds[groupIndex];
    if (!group) {
      return { error: "Round group not found", code: "NOT_FOUND" };
    }
    const subRound = group.updateSubRound(subRoundIndex, { title });
    if (!subRound) {
      return { error: "Sub-round not found", code: "NOT_FOUND" };
    }
    this.touch();
    return { subRound };
  }

  /** Resolve a sub-round by flat index (for target upload). */
  getSubRoundByFlatIndex(flatIndex) {
    const entry = this.flatSubRounds()[flatIndex];
    return entry ?? null;
  }

  allRoundsReady() {
    if (this.rounds.length === 0) return false;
    return this.rounds.every((g) => g.allSubRoundsReady());
  }

  startGame() {
    if (this.gameStarted) {
      return { error: "Game already started", code: "ALREADY_STARTED" };
    }
    if (!this.allRoundsReady()) {
      return {
        error: "All sub-rounds must have target images",
        code: "INCOMPLETE_ROUNDS",
      };
    }
    this.gameStarted = true;
    this.currentRoundIndex = 0;
    this.totalRounds = this.flatSubRounds().length;
    const first = this.currentRound;
    if (first) first.status = "active";
    this.touch();
    return { ok: true };
  }

  setState(next) {
    this.state = next;
    this.touch();
  }

  get isLastRound() {
    return this.currentRoundIndex >= this.flatSubRounds().length - 1;
  }

  leaderboard() {
    const sorted = [...this.players.values()].sort(
      (a, b) => b.totalScore - a.totalScore || a.joinedAt - b.joinedAt,
    );

    const round = this.currentRound;
    return sorted.map((player, idx) => {
      const rank = idx + 1;
      const movement =
        player.previousRank === null
          ? "same"
          : player.previousRank > rank
            ? "up"
            : player.previousRank < rank
              ? "down"
              : "same";
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
  }

  commitRanks() {
    this.leaderboard().forEach((entry) => {
      const player = this.players.get(entry.playerId);
      if (player) player.previousRank = entry.rank;
    });
  }

  /**
   * Leaderboard data safe to send to a player socket.
   * Full standings are revealed only when the tournament ends; during RESULTS
   * each player sees only their own round score.
   */
  leaderboardForPlayer(playerId) {
    if (this.state === GameState.GAME_FINISHED) {
      return this.leaderboard();
    }
    if (this.state === GameState.RESULTS && playerId) {
      const me = this.leaderboard().find((entry) => entry.playerId === playerId);
      if (!me) return [];
      return [
        {
          playerId: me.playerId,
          name: me.name,
          roundScore: me.roundScore,
          connected: me.connected,
          rank: null,
          totalScore: null,
          movement: "same",
        },
      ];
    }
    return [];
  }

  #snapshotBase() {
    const round = this.currentRound;
    const group = this.currentRoundGroup;
    const hintVisible = PLAYER_HINT_VISIBLE_STATES.has(this.state);
    const originalVisible = ORIGINAL_IMAGE_VISIBLE_STATES.has(this.state);
    const flat = this.flatSubRounds();

    return {
      code: this.code,
      state: this.state,
      roundSeconds: this.roundSeconds,
      totalRounds: flat.length,
      currentRound: this.currentRoundIndex + 1,
      currentRoundIndex: this.currentRoundIndex,
      currentRoundTitle: round?.title ?? null,
      currentRoundGroupTitle: group?.title ?? null,
      gameStarted: this.gameStarted,
      hasTarget: round?.hasTarget ?? false,
      targetHint: hintVisible ? (round?.targetHint ?? null) : null,
      targetPreview: originalVisible ? (round?.targetPreview ?? null) : null,
      remainingSeconds: round ? round.remainingSeconds() : this.roundSeconds,
      players: [...this.players.values()].map((p) => p.toPublic()),
    };
  }

  toPublic() {
    return {
      ...this.#snapshotBase(),
      leaderboard: [],
    };
  }

  toPlayerPublic(playerId) {
    const snapshot = this.#snapshotBase();
    const round = this.currentRound;
    // Hide the clue once this player has submitted — original reveals in RESULTS only.
    if (round?.hasSubmitted(playerId)) {
      snapshot.targetHint = null;
    }
    return {
      ...snapshot,
      leaderboard: this.leaderboardForPlayer(playerId),
    };
  }

  toHostPublic() {
    const showStandings = this.state === GameState.GAME_FINISHED;
    const publicData = {
      ...this.#snapshotBase(),
      leaderboard: showStandings ? this.leaderboard() : [],
    };
    const entry = this.currentRoundEntry;
    const showTarget = ORIGINAL_IMAGE_VISIBLE_STATES.has(this.state);
    return {
      ...publicData,
      rounds: this.rounds.map((g) => g.toHostPublic()),
      allRoundsReady: this.allRoundsReady(),
      targetPreview: showTarget
        ? (this.currentRound?.targetPreview ?? null)
        : null,
      currentSubRound: entry
        ? {
            groupIndex: entry.group.index,
            subRoundIndex: entry.subRound.index,
            ...entry.subRound.toHostPublic({
              includeTargetPreview: showTarget,
            }),
          }
        : null,
    };
  }
}

const PLAYER_HINT_VISIBLE_STATES = new Set([
  GameState.ROUND_STARTING,
  GameState.SEARCHING,
  GameState.SUBMISSIONS_CLOSED,
  GameState.AI_PROCESSING,
]);

const ORIGINAL_IMAGE_VISIBLE_STATES = new Set([
  GameState.RESULTS,
  GameState.GAME_FINISHED,
]);
