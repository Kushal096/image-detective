import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../../layouts/AppLayout.jsx";
import { Spinner } from "../../components/ui/Spinner.jsx";
import { useGame } from "../../contexts/gameContext.js";
import { useToast } from "../../contexts/toastContext.js";
import { GameState } from "../../services/socket/events.js";
import { loadSession, clearSession } from "../../utils/storage.js";
import { RoundSetup } from "./RoundSetup.jsx";
import { GameControl } from "./GameControl.jsx";
import { FinalTournamentResults } from "./FinalTournamentResults.jsx";

/**
 * Host command center. Restores the saved host session on refresh so rounds,
 * players, and live game state survive page reloads.
 */
export const HostDashboard = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const {
    room,
    identity,
    connected,
    createRoom,
    restoreSession,
    rejoinHost,
    leaveGame,
  } = useGame();
  const initRef = useRef(false);
  const [initializing, setInitializing] = useState(true);
  const [currentPage, setCurrentPage] = useState("setup");

  // Restore saved host credentials before socket rejoin runs.
  useLayoutEffect(() => {
    const saved = loadSession({ role: "host" });
    if (saved?.code && saved?.hostId) {
      restoreSession(saved);
    }
  }, [restoreSession]);

  // Rejoin existing room or create a new one on first visit.
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    (async () => {
      const saved = loadSession({ role: "host" });
      if (saved?.code && saved?.hostId) {
        restoreSession(saved);
        const res = await rejoinHost();
        if (res?.ok) {
          toast.success("Host session restored");
          setInitializing(false);
          return;
        }
        clearSession(saved.code);
        toast.error("Previous room expired — creating a new one");
      }

      const created = await createRoom({});
      if (!created?.ok) initRef.current = false;
      setInitializing(false);
    })();
  }, [createRoom, restoreSession, rejoinHost, toast]);

  useEffect(() => {
    if (room?.gameStarted) {
      setCurrentPage("control");
    }
  }, [room?.gameStarted]);

  const code = identity?.code;
  const ready = !initializing && code && room && room.code === code;

  if (!ready) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center gap-4 pt-32">
          <Spinner />
          <p className="font-label uppercase tracking-widest text-text-secondary text-sm">
            {connected ? "Restoring session…" : "Connecting to server…"}
          </p>
        </div>
      </AppLayout>
    );
  }

  const isFinished = room.state === GameState.GAME_FINISHED;

  const handleExit = () => {
    leaveGame();
    navigate("/");
  };

  const handleNewGame = () => {
    leaveGame();
    window.location.reload();
  };

  if (isFinished) {
    return (
      <FinalTournamentResults onExit={handleExit} onNewGame={handleNewGame} />
    );
  }

  if (currentPage === "setup") {
    return <RoundSetup onStartGame={() => setCurrentPage("control")} />;
  }

  return <GameControl />;
};
