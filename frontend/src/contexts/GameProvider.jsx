import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSocket, emitWithAck } from "../services/socket/socketClient.js";
import { SocketEvents, GameState } from "../services/socket/events.js";
import { loadSession, saveSession, clearSession } from "../utils/storage.js";
import { useToast } from "./toastContext.js";
import { GameContext } from "./gameContext.js";

/**
 * Owns the live game session: the socket connection, the authoritative room
 * snapshot, the synchronized timer, and host/player identity. All gameplay
 * actions funnel through here so components stay declarative.
 */
export const GameProvider = ({ children }) => {
  const toast = useToast();
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [lastScore, setLastScore] = useState(null);
  const [submittedThisRound, setSubmittedThisRound] = useState(false);
  const [identity, setIdentity] = useState(null);

  const identityRef = useRef(identity);
  useEffect(() => {
    identityRef.current = identity;
  }, [identity]);

  const persistIdentity = useCallback((next) => {
    setIdentity(next);
    if (next) saveSession(next);
    else clearSession(identityRef.current?.code);
  }, []);

  const restoreSession = useCallback(
    (session) => {
      if (session) persistIdentity(session);
    },
    [persistIdentity],
  );

  const rejoinHost = useCallback(async () => {
    const id = identityRef.current;
    if (id?.role !== "host" || !id.code || !id.hostId) {
      return { ok: false, code: "NO_SESSION" };
    }
    const res = await emitWithAck(SocketEvents.HOST_REJOIN, {
      code: id.code,
      hostId: id.hostId,
    });
    if (res?.ok) {
      setRemaining(null);
    }
    return res;
  }, []);

  const rejoinPlayer = useCallback(async () => {
    const id = identityRef.current;
    if (id?.role !== "player" || !id.code || !id.playerId) {
      return { ok: false, code: "NO_SESSION" };
    }
    const res = await emitWithAck(SocketEvents.PLAYER_REJOIN, {
      code: id.code,
      playerId: id.playerId,
    });
    if (res?.ok) {
      setSubmittedThisRound(Boolean(res.hasSubmittedThisRound));
      setRemaining(null);
    }
    return res;
  }, []);

  // ── Socket lifecycle & subscriptions ──────────────────
  useEffect(() => {
    const socket = getSocket();

    const onConnect = async () => {
      setConnected(true);
      const id = identityRef.current;
      if (id?.role === "host" && id.code && id.hostId) {
        await rejoinHost();
      } else if (id?.role === "player" && id.code && id.playerId) {
        await rejoinPlayer();
      }
    };

    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      const s = getSocket();
      if (!s.connected) s.connect();
      const id = identityRef.current;
      if (id?.role === "host" && id.code && id.hostId) {
        rejoinHost();
      } else if (id?.role === "player" && id.code && id.playerId) {
        rejoinPlayer();
      }
    };

    const onDisconnect = () => setConnected(false);
    const onRoomState = (snapshot) => {
      setRoom(snapshot);
      if (snapshot.state === GameState.ROUND_STARTING) {
        setRemaining(snapshot.roundSeconds ?? null);
        setSubmittedThisRound(false);
      } else if (typeof snapshot.remainingSeconds === "number") {
        setRemaining((prev) =>
          prev === null ? snapshot.remainingSeconds : prev,
        );
      }
    };
    const onStateChanged = () => setLastScore(null);
    const onTimer = ({ remaining: r }) => setRemaining(r);
    const onScored = (payload) => {
      setLastScore(payload);
      setSubmittedThisRound(true);
      if (payload.hintReuse) {
        toast.error("Clue image reuse detected — 0 points");
      } else {
        toast.success(`Scored ${payload.score} points`);
      }
    };
    const onError = ({ message }) =>
      toast.error(message ?? "Something went wrong");

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on(SocketEvents.ROOM_STATE, onRoomState);
    socket.on(SocketEvents.STATE_CHANGED, onStateChanged);
    socket.on(SocketEvents.TIMER_TICK, onTimer);
    socket.on(SocketEvents.SUBMISSION_SCORED, onScored);
    socket.on(SocketEvents.ROOM_ERROR, onError);
    document.addEventListener("visibilitychange", onVisibility);

    if (!socket.connected) socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off(SocketEvents.ROOM_STATE, onRoomState);
      socket.off(SocketEvents.STATE_CHANGED, onStateChanged);
      socket.off(SocketEvents.TIMER_TICK, onTimer);
      socket.off(SocketEvents.SUBMISSION_SCORED, onScored);
      socket.off(SocketEvents.ROOM_ERROR, onError);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [toast, rejoinHost, rejoinPlayer]);

  // ── Actions ───────────────────────────────────────────
  const createRoom = useCallback(
    async ({ roundSeconds, totalRounds } = {}) => {
      const res = await emitWithAck(SocketEvents.HOST_CREATE_ROOM, {
        roundSeconds,
        totalRounds,
      });
      if (res?.ok) {
        persistIdentity({ role: "host", code: res.code, hostId: res.hostId });
      }
      return res;
    },
    [persistIdentity],
  );

  const joinRoom = useCallback(
    async ({ code, name }) => {
      const res = await emitWithAck(SocketEvents.PLAYER_JOIN, { code, name });
      if (res?.ok) {
        persistIdentity({
          role: "player",
          code: res.code,
          playerId: res.playerId,
          name,
        });
        setSubmittedThisRound(Boolean(res.hasSubmittedThisRound));
        if (res.resumed) toast.success("Welcome back — session restored");
      } else toast.error(res?.message ?? "Could not join room");
      return res;
    },
    [persistIdentity, toast],
  );

  const hostAction = useCallback(
    async (event, extraPayload = {}) => {
      const id = identityRef.current;
      if (id?.role !== "host") return { ok: false };
      const res = await emitWithAck(event, {
        code: id.code,
        hostId: id.hostId,
        ...extraPayload,
      });
      if (res && !res.ok) toast.error(res.message ?? "Action failed");
      return res;
    },
    [toast],
  );

  const markSubmitted = useCallback(() => setSubmittedThisRound(true), []);

  const leaveGame = useCallback(() => {
    persistIdentity(null);
    setRoom(null);
    setRemaining(null);
    setLastScore(null);
    setSubmittedThisRound(false);
  }, [persistIdentity]);

  const value = useMemo(
    () => ({
      connected,
      room,
      remaining,
      lastScore,
      identity,
      submittedThisRound,
      isHost: identity?.role === "host",
      createRoom,
      joinRoom,
      restoreSession,
      rejoinHost,
      rejoinPlayer,
      markSubmitted,
      addRound: (title) => hostAction(SocketEvents.HOST_ADD_ROUND, { title }),
      removeRound: (roundIndex) =>
        hostAction(SocketEvents.HOST_REMOVE_ROUND, { roundIndex }),
      updateRound: (roundIndex, title) =>
        hostAction(SocketEvents.HOST_UPDATE_ROUND, { roundIndex, title }),
      reorderRounds: (newOrder) =>
        hostAction(SocketEvents.HOST_REORDER_ROUNDS, { newOrder }),
      addSubRound: (roundIndex, title) =>
        hostAction(SocketEvents.HOST_ADD_SUB_ROUND, { roundIndex, title }),
      removeSubRound: (roundIndex, subRoundIndex) =>
        hostAction(SocketEvents.HOST_REMOVE_SUB_ROUND, {
          roundIndex,
          subRoundIndex,
        }),
      updateSubRound: (roundIndex, subRoundIndex, title) =>
        hostAction(SocketEvents.HOST_UPDATE_SUB_ROUND, {
          roundIndex,
          subRoundIndex,
          title,
        }),
      startGame: () => hostAction(SocketEvents.HOST_START_GAME),
      startRound: () => hostAction(SocketEvents.HOST_START_ROUND),
      skipRound: () => hostAction(SocketEvents.HOST_SKIP_ROUND),
      nextRound: () => hostAction(SocketEvents.HOST_NEXT_ROUND),
      endGame: () => hostAction(SocketEvents.HOST_END_GAME),
      leaveGame,
    }),
    [
      connected,
      room,
      remaining,
      lastScore,
      identity,
      submittedThisRound,
      createRoom,
      joinRoom,
      restoreSession,
      rejoinHost,
      rejoinPlayer,
      markSubmitted,
      hostAction,
      leaveGame,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
