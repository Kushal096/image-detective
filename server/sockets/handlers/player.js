import { SocketEvents } from "../../config/constants.js";
import { normalizeRoomCode, sanitizeUsername } from "../../utils/validation.js";

/**
 * Registers player socket events: joining, reconnecting, and leaving. Image
 * submissions go over REST (binary), not sockets.
 */
export const registerPlayerHandlers = ({
  socket,
  gameService,
  roomManager,
  broadcaster,
}) => {
  const ack = (cb, payload) => typeof cb === "function" && cb(payload);

  socket.on(SocketEvents.PLAYER_JOIN, (payload = {}, cb) => {
    const room = roomManager.getRoom(normalizeRoomCode(payload.code));
    if (!room)
      return ack(cb, {
        ok: false,
        code: "NOT_FOUND",
        message: "Room not found",
      });

    const name = sanitizeUsername(payload.name);
    if (!name)
      return ack(cb, {
        ok: false,
        code: "BAD_NAME",
        message: "Invalid display name",
      });

    const { player, error, code, resumed } = gameService.joinRoom({
      room,
      name,
      socketId: socket.id,
    });
    if (error) return ack(cb, { ok: false, code, message: error });

    socket.join(room.code);
    socket.data.roomCode = room.code;
    socket.data.playerId = player.id;

    ack(cb, {
      ok: true,
      playerId: player.id,
      code: room.code,
      state: room.state,
      resumed: Boolean(resumed),
    });
    broadcaster.roomState(room);
    if (!resumed) {
      broadcaster.toSocket(
        room.hostSocketId,
        SocketEvents.PLAYER_JOINED,
        player.toPublic(),
      );
    }
  });

  socket.on(SocketEvents.PLAYER_REJOIN, (payload = {}, cb) => {
    const room = roomManager.getRoom(normalizeRoomCode(payload.code));
    if (!room)
      return ack(cb, {
        ok: false,
        code: "NOT_FOUND",
        message: "Room not found",
      });

    const { player, error, code } = gameService.rejoinRoom({
      room,
      playerId: payload.playerId,
      socketId: socket.id,
    });
    if (error) return ack(cb, { ok: false, code, message: error });

    socket.join(room.code);
    socket.data.roomCode = room.code;
    socket.data.playerId = player.id;

    ack(cb, {
      ok: true,
      playerId: player.id,
      code: room.code,
      state: room.state,
    });
    broadcaster.roomState(room);
  });
};
