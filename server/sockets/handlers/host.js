import { SocketEvents } from '../../config/constants.js';
import { normalizeRoomCode } from '../../utils/validation.js';

/**
 * Registers host-only socket events. Every privileged action re-verifies the
 * host token against the room — the server never trusts a client claim of being
 * the host.
 */
export const registerHostHandlers = ({ socket, gameService, roomManager, broadcaster }) => {
  const ack = (cb, payload) => typeof cb === 'function' && cb(payload);

  const authorize = (code, hostId) => {
    const room = roomManager.getRoom(normalizeRoomCode(code));
    if (!room) return { error: { ok: false, code: 'NOT_FOUND', message: 'Room not found' } };
    if (room.hostId !== hostId) {
      return { error: { ok: false, code: 'FORBIDDEN', message: 'Not the host' } };
    }
    return { room };
  };

  socket.on(SocketEvents.HOST_CREATE_ROOM, (payload = {}, cb) => {
    const room = gameService.createRoom({
      socketId: socket.id,
      roundSeconds: payload.roundSeconds,
      totalRounds: payload.totalRounds,
    });
    socket.join(room.code);
    socket.data.roomCode = room.code;
    socket.data.isHost = true;
    ack(cb, { ok: true, code: room.code, hostId: room.hostId, state: room.state });
    broadcaster.roomState(room);
  });

  const hostAction = (event, run) => {
    socket.on(event, async (payload = {}, cb) => {
      const { room, error } = authorize(payload.code, payload.hostId);
      if (error) return ack(cb, error);
      // Re-bind host socket on reconnect.
      room.hostSocketId = socket.id;
      socket.join(room.code);
      const result = (await run(room, payload)) ?? { ok: true };
      ack(cb, result.error ? { ok: false, ...result } : { ok: true, ...result });
    });
  };

  // Round management (pre-game only)
  hostAction(SocketEvents.HOST_ADD_ROUND, async (room) => {
    const result = room.addRound();
    if (!result.error) broadcaster.roomState(room);
    return result;
  });

  hostAction(SocketEvents.HOST_REMOVE_ROUND, async (room, payload) => {
    const result = room.removeRound(payload.roundIndex);
    if (!result.error) broadcaster.roomState(room);
    return result;
  });

  hostAction(SocketEvents.HOST_UPDATE_ROUND, async (room, payload) => {
    const result = room.updateRound(payload.roundIndex, { title: payload.title });
    if (!result.error) broadcaster.roomState(room);
    return result;
  });

  hostAction(SocketEvents.HOST_REORDER_ROUNDS, async (room, payload) => {
    const result = room.reorderRounds(payload.newOrder);
    if (!result.error) broadcaster.roomState(room);
    return result;
  });

  // Game flow
  hostAction(SocketEvents.HOST_START_GAME, (room) => {
    const result = room.startGame();
    if (!result.error) {
      broadcaster.roomState(room);
    }
    return result;
  });

  hostAction(SocketEvents.HOST_START_ROUND, (room) => gameService.startRound({ room }));
  hostAction(SocketEvents.HOST_SKIP_ROUND, (room) => gameService.skipRound({ room }));
  hostAction(SocketEvents.HOST_NEXT_ROUND, (room) => gameService.nextRound({ room }));
  hostAction(SocketEvents.HOST_END_GAME, (room) => gameService.endGame({ room }));
};
