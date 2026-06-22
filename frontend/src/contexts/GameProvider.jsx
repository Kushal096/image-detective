import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getSocket, emitWithAck } from '../services/socket/socketClient.js';
import { SocketEvents, GameState } from '../services/socket/events.js';
import { loadSession, saveSession, clearSession } from '../utils/storage.js';
import { useToast } from './toastContext.js';
import { GameContext } from './gameContext.js';

/**
 * Owns the live game session: the socket connection, the authoritative room
 * snapshot, the synchronized timer, and the player's identity. All gameplay
 * actions funnel through here so components stay declarative and never touch
 * the socket directly.
 */
export const GameProvider = ({ children }) => {
  const toast = useToast();
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [lastScore, setLastScore] = useState(null);
  const [identity, setIdentity] = useState(() => loadSession());

  // Mirror identity into a ref so socket listeners read the latest value.
  const identityRef = useRef(identity);
  useEffect(() => {
    identityRef.current = identity;
  }, [identity]);

  const persistIdentity = useCallback((next) => {
    setIdentity(next);
    if (next) saveSession(next);
    else clearSession();
  }, []);

  // ── Socket lifecycle & subscriptions ──────────────────
  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => {
      setConnected(true);
      const id = identityRef.current;
      // Recover a player session transparently after a reconnect.
      if (id?.role === 'player' && id.code && id.playerId) {
        emitWithAck(SocketEvents.PLAYER_REJOIN, { code: id.code, playerId: id.playerId });
      }
    };
    const onDisconnect = () => setConnected(false);
    const onRoomState = (snapshot) => {
      setRoom(snapshot);
      // The server is authoritative for the timer. Show the full duration at
      // round start; otherwise seed from the snapshot only if we have no value.
      if (snapshot.state === GameState.ROUND_STARTING) {
        setRemaining(snapshot.roundSeconds ?? null);
      } else if (typeof snapshot.remainingSeconds === 'number') {
        setRemaining((prev) => (prev === null ? snapshot.remainingSeconds : prev));
      }
    };
    const onStateChanged = () => setLastScore(null);
    const onTimer = ({ remaining: r }) => setRemaining(r);
    const onScored = (payload) => {
      setLastScore(payload);
      toast.success(`Scored ${payload.score} points`);
    };
    const onError = ({ message }) => toast.error(message ?? 'Something went wrong');

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on(SocketEvents.ROOM_STATE, onRoomState);
    socket.on(SocketEvents.STATE_CHANGED, onStateChanged);
    socket.on(SocketEvents.TIMER_TICK, onTimer);
    socket.on(SocketEvents.SUBMISSION_SCORED, onScored);
    socket.on(SocketEvents.ROOM_ERROR, onError);

    if (!socket.connected) socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off(SocketEvents.ROOM_STATE, onRoomState);
      socket.off(SocketEvents.STATE_CHANGED, onStateChanged);
      socket.off(SocketEvents.TIMER_TICK, onTimer);
      socket.off(SocketEvents.SUBMISSION_SCORED, onScored);
      socket.off(SocketEvents.ROOM_ERROR, onError);
    };
  }, [toast]);

  // ── Actions ───────────────────────────────────────────
  const createRoom = useCallback(
    async ({ roundSeconds, totalRounds } = {}) => {
      const res = await emitWithAck(SocketEvents.HOST_CREATE_ROOM, { roundSeconds, totalRounds });
      if (res?.ok) persistIdentity({ role: 'host', code: res.code, hostId: res.hostId });
      return res;
    },
    [persistIdentity],
  );

  const joinRoom = useCallback(
    async ({ code, name }) => {
      const res = await emitWithAck(SocketEvents.PLAYER_JOIN, { code, name });
      if (res?.ok) persistIdentity({ role: 'player', code: res.code, playerId: res.playerId, name });
      else toast.error(res?.message ?? 'Could not join room');
      return res;
    },
    [persistIdentity, toast],
  );

  const hostAction = useCallback(
    async (event) => {
      const id = identityRef.current;
      if (id?.role !== 'host') return { ok: false };
      const res = await emitWithAck(event, { code: id.code, hostId: id.hostId });
      if (res && !res.ok) toast.error(res.message ?? 'Action failed');
      return res;
    },
    [toast],
  );

  const leaveGame = useCallback(() => {
    persistIdentity(null);
    setRoom(null);
    setRemaining(null);
    setLastScore(null);
  }, [persistIdentity]);

  const value = useMemo(
    () => ({
      connected,
      room,
      remaining,
      lastScore,
      identity,
      isHost: identity?.role === 'host',
      createRoom,
      joinRoom,
      startRound: () => hostAction(SocketEvents.HOST_START_ROUND),
      skipRound: () => hostAction(SocketEvents.HOST_SKIP_ROUND),
      nextRound: () => hostAction(SocketEvents.HOST_NEXT_ROUND),
      endGame: () => hostAction(SocketEvents.HOST_END_GAME),
      leaveGame,
    }),
    [connected, room, remaining, lastScore, identity, createRoom, joinRoom, hostAction, leaveGame],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
