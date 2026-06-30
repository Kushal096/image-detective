import { GameState, SocketEvents } from '../config/constants.js';

/**
 * Thin transport adapter around Socket.IO. Centralizes every outbound emit so
 * GameService stays free of transport details and event-name strings.
 */
export class Broadcaster {
  constructor(io) {
    this.io = io;
  }

  /** Broadcasts room snapshots — full standings to host, redacted views to players. */
  roomState(room) {
    for (const player of room.players.values()) {
      if (player.socketId) {
        this.io
          .to(player.socketId)
          .emit(SocketEvents.ROOM_STATE, room.toPlayerPublic(player.id));
      }
    }
    if (room.hostSocketId) {
      this.io.to(room.hostSocketId).emit(SocketEvents.ROOM_STATE, {
        ...room.toHostPublic(),
        isHost: true,
      });
    }
  }

  stateChanged(room) {
    this.io.to(room.code).emit(SocketEvents.STATE_CHANGED, { state: room.state });
    this.roomState(room);
  }

  timerTick(room, remaining) {
    this.io.to(room.code).emit(SocketEvents.TIMER_TICK, { remaining });
  }

  leaderboard(room) {
    if (!room.hostSocketId || room.state !== GameState.GAME_FINISHED) return;
    this.io.to(room.hostSocketId).emit(SocketEvents.LEADERBOARD_UPDATE, {
      leaderboard: room.leaderboard(),
    });
  }

  scoredToPlayer(socketId, payload) {
    if (socketId) this.io.to(socketId).emit(SocketEvents.SUBMISSION_SCORED, payload);
  }

  toSocket(socketId, event, payload) {
    if (socketId) this.io.to(socketId).emit(event, payload);
  }

  errorToSocket(socketId, message, code = 'ERROR') {
    if (socketId) this.io.to(socketId).emit(SocketEvents.ROOM_ERROR, { message, code });
  }
}
