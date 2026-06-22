import { SocketEvents } from '../config/constants.js';

/**
 * Thin transport adapter around Socket.IO. Centralizes every outbound emit so
 * GameService stays free of transport details and event-name strings.
 */
export class Broadcaster {
  constructor(io) {
    this.io = io;
  }

  /** Broadcasts the full public room snapshot to everyone in the room. */
  roomState(room) {
    this.io.to(room.code).emit(SocketEvents.ROOM_STATE, room.toPublic());
    // Host receives an augmented snapshot including the (private) target preview.
    if (room.hostSocketId) {
      const round = room.currentRound;
      this.io.to(room.hostSocketId).emit(SocketEvents.ROOM_STATE, {
        ...room.toPublic(),
        isHost: true,
        targetPreview: round?.targetPreview ?? null,
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
    this.io.to(room.code).emit(SocketEvents.LEADERBOARD_UPDATE, {
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
