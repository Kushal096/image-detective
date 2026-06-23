import { GameState, ROUND_STARTING_DELAY_MS } from "../config/constants.js";
import { env } from "../config/env.js";
import { newUuid } from "../utils/ids.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("game");

/**
 * The orchestration core. Coordinates rooms, the authoritative timer, the AI
 * submission queue/worker pool, persistence, and Socket.IO broadcasts.
 *
 * Every state transition is driven here so the server remains the single source
 * of truth; clients only render the snapshots we emit.
 */
export class GameService {
  constructor({
    roomManager,
    timerManager,
    queue,
    broadcaster,
    scoringService,
    store,
  }) {
    this.rooms = roomManager;
    this.timers = timerManager;
    this.queue = queue;
    this.bus = broadcaster;
    this.scoring = scoringService;
    this.store = store;
  }

  // ── Room lifecycle ────────────────────────────────────
  createRoom({ socketId, roundSeconds, totalRounds }) {
    const hostId = newUuid();
    const room = this.rooms.createRoom({ hostId, roundSeconds, totalRounds });
    room.hostSocketId = socketId;
    return room;
  }

  /** Adds a player to a room (or fails with a typed reason). */
  joinRoom({ room, name, socketId }) {
    if (room.state !== GameState.WAITING_ROOM) {
      return { error: "Game already in progress", code: "IN_PROGRESS" };
    }
    if (room.playerCount >= env.game.maxPlayersPerRoom) {
      return { error: "Room is full", code: "ROOM_FULL" };
    }
    if (room.hasName(name)) {
      return { error: "Name already taken in this room", code: "NAME_TAKEN" };
    }
    const player = room.addPlayer({ id: newUuid(), name, socketId });
    return { player };
  }

  /** Re-binds an existing player identity to a fresh socket after reconnect. */
  rejoinRoom({ room, playerId, socketId }) {
    const player = room.getPlayer(playerId);
    if (!player) return { error: "Session not found", code: "NO_SESSION" };
    player.socketId = socketId;
    player.connected = true;
    return { player };
  }

  // ── Target & round control (host only) ────────────────
  /** Returns the round that the next start should use, creating one if needed. */
  #ensureUpcomingRound(room) {
    const current = room.currentRound;
    if (!current || current.startedAt) return room.createNextRound();
    return current;
  }

  async setTarget({
    room,
    embedding,
    previewDataUrl,
    hintDataUrl,
    hintEmbedding,
  }) {
    const round = this.#ensureUpcomingRound(room);
    round.setTarget(embedding, previewDataUrl, hintDataUrl, hintEmbedding);
    this.bus.roomState(room);
    return round;
  }

  startRound({ room }) {
    const round = room.currentRound;
    if (!round || !round.hasTarget) {
      return { error: "Set a target image before starting", code: "NO_TARGET" };
    }
    if (room.state === GameState.SEARCHING) {
      return { error: "Round already running", code: "ALREADY_RUNNING" };
    }

    room.setState(GameState.ROUND_STARTING);
    this.bus.stateChanged(room);

    setTimeout(() => this.#beginSearching(room), ROUND_STARTING_DELAY_MS);
    return { ok: true };
  }

  #beginSearching(room) {
    const round = room.currentRound;
    if (!round) return;
    round.start();
    room.setState(GameState.SEARCHING);
    this.bus.stateChanged(room);

    this.timers.start(room.code, {
      getRemaining: () => round.remainingSeconds(),
      onTick: (remaining) => this.bus.timerTick(room, remaining),
      onExpire: () => this.#closeSubmissions(room),
    });
    log.info("round searching", {
      code: room.code,
      round: room.currentRound.index,
    });
  }

  skipRound({ room }) {
    this.timers.clear(room.code);
    this.#closeSubmissions(room);
    return { ok: true };
  }

  #closeSubmissions(room) {
    if (
      room.state === GameState.RESULTS ||
      room.state === GameState.GAME_FINISHED
    )
      return;
    room.setState(GameState.SUBMISSIONS_CLOSED);
    this.bus.stateChanged(room);

    room.setState(GameState.AI_PROCESSING);
    this.bus.stateChanged(room);
    this.#maybeFinishProcessing(room);
  }

  #maybeFinishProcessing(room) {
    const round = room.currentRound;
    if (!round) return;
    if (room.state !== GameState.AI_PROCESSING) return;
    if (!round.isProcessingComplete) return; // workers will re-trigger on drain
    this.#finalizeResults(room);
  }

  #finalizeResults(room) {
    room.commitRanks();
    room.setState(GameState.RESULTS);
    this.bus.stateChanged(room);
    this.bus.leaderboard(room);
    log.info("round results", {
      code: room.code,
      round: room.currentRound?.index,
    });
  }

  nextRound({ room }) {
    if (room.isLastRound) {
      return this.endGame({ room });
    }
    room.createNextRound();
    room.setState(GameState.WAITING_ROOM);
    this.bus.stateChanged(room);
    return { ok: true };
  }

  async endGame({ room }) {
    this.timers.clear(room.code);
    room.commitRanks();
    room.setState(GameState.GAME_FINISHED);
    this.bus.stateChanged(room);
    this.bus.leaderboard(room);
    await this.#persist(room);
    return { ok: true };
  }

  async #persist(room) {
    try {
      await this.store.saveGame({
        id: newUuid(),
        code: room.code,
        finishedAt: Date.now(),
        totalRounds: room.rounds.length,
        leaderboard: room.leaderboard(),
      });
    } catch (err) {
      log.error("persist failed", err.message);
    }
  }

  // ── Submissions / scoring ─────────────────────────────
  /**
   * Validates submission preconditions and enqueues the scoring job.
   * Returns synchronously; the worker pool scores asynchronously.
   */
  enqueueSubmission({ room, player, buffer }) {
    const round = room.currentRound;
    if (room.state !== GameState.SEARCHING || !round) {
      return { error: "Submissions are closed", code: "CLOSED" };
    }
    if (round.remainingSeconds() <= 0) {
      return { error: "Time is up", code: "TIME_UP" };
    }
    if (round.hasSubmitted(player.id)) {
      return { error: "You already submitted this round", code: "DUPLICATE" };
    }

    round.lockPending(player.id);
    this.queue.enqueue({
      roomCode: room.code,
      playerId: player.id,
      buffer,
      targetEmbedding: round.targetEmbedding,
      hintEmbedding: round.hintEmbedding,
      onError: () => this.#onScoreError(room.code, player.id),
    });
    return { ok: true, queueSize: this.queue.size };
  }

  /** Worker-pool processor: scores one job and applies the result. */
  processSubmission = async (job) => {
    const result = await this.scoring.score(
      job.buffer,
      job.targetEmbedding,
      job.hintEmbedding,
    );
    this.#applyScore(job.roomCode, job.playerId, result);
  };

  #applyScore(roomCode, playerId, { similarity, score, hintReuse = false }) {
    const room = this.rooms.getRoom(roomCode);
    if (!room) return;
    const round = room.currentRound;
    const player = room.getPlayer(playerId);
    if (!round || !player) return;

    round.recordSubmission(playerId, { score, similarity });
    player.totalScore += score;

    this.bus.scoredToPlayer(player.socketId, {
      score,
      similarity,
      totalScore: player.totalScore,
      hintReuse,
    });
    this.bus.leaderboard(room);
    this.bus.roomState(room);

    this.#maybeFinishProcessing(room);
  }

  #onScoreError(roomCode, playerId) {
    const room = this.rooms.getRoom(roomCode);
    const round = room?.currentRound;
    if (!round) return;
    round.releasePending(playerId);
    const player = room.getPlayer(playerId);
    this.bus.errorToSocket(
      player?.socketId,
      "Scoring failed, please retry",
      "SCORE_FAILED",
    );
    this.#maybeFinishProcessing(room);
  }

  // ── Disconnects ───────────────────────────────────────
  handleDisconnect(socketId) {
    // Linear scan is fine for the expected room/player counts.
    for (const room of this.#allRooms()) {
      if (room.hostSocketId === socketId) {
        room.hostSocketId = null;
        continue;
      }
      for (const player of room.players.values()) {
        if (player.socketId === socketId) {
          player.connected = false;
          this.bus.roomState(room);
          return;
        }
      }
    }
  }

  *#allRooms() {
    // RoomManager keeps rooms private; expose via its public accessor.
    yield* this.rooms.values();
  }
}
