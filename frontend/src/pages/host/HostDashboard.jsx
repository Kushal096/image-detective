import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../layouts/AppLayout.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { useGame } from '../../contexts/gameContext.js';
import { GameState } from '../../services/socket/events.js';
import { RoundSetup } from './RoundSetup.jsx';
import { GameControl } from './GameControl.jsx';
import { FinalTournamentResults } from './FinalTournamentResults.jsx';

/**
 * Host command center. Routes between Round Setup (pre-game configuration)
 * and Game Control (live tournament management). Automatically transitions
 * to Game Control when the host starts the game.
 */
export const HostDashboard = () => {
  const navigate = useNavigate();
  const { room, identity, connected, createRoom } = useGame();
  const createdRef = useRef(false);
  const [currentPage, setCurrentPage] = useState('setup');

  // Create a fresh room once on entry (guarded against StrictMode double-run).
  useEffect(() => {
    if (createdRef.current) return;
    createdRef.current = true;
    createRoom({}).catch(() => {
      createdRef.current = false;
    });
  }, [createRoom]);

  // Auto-navigate to Game Control when game starts
  useEffect(() => {
    if (room?.gameStarted && currentPage !== 'control') {
      setCurrentPage('control');
    }
  }, [room?.gameStarted, currentPage]);

  const code = identity?.code;
  const ready = code && room && room.code === code;

  if (!ready) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center gap-4 pt-32">
          <Spinner />
          <p className="font-label uppercase tracking-widest text-text-secondary text-sm">
            {connected ? 'Provisioning room…' : 'Connecting to server…'}
          </p>
        </div>
      </AppLayout>
    );
  }

  const isFinished = room.state === GameState.GAME_FINISHED;

  if (isFinished) {
    return <FinalTournamentResults onExit={() => navigate('/')} onNewGame={() => window.location.reload()} />;
  }

  if (currentPage === 'setup') {
    return <RoundSetup onStartGame={() => setCurrentPage('control')} />;
  }

  return <GameControl />;
};
