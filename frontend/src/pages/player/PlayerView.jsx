import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../layouts/AppLayout.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { StateBadge } from '../../components/game/StateBadge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useGame } from '../../contexts/gameContext.js';
import { useToast } from '../../contexts/toastContext.js';
import { GameState } from '../../services/socket/events.js';
import { apiClient } from '../../services/api/client.js';
import { Lobby } from './screens/Lobby.jsx';
import { SearchScreen } from './screens/SearchScreen.jsx';
import { ProcessingScreen } from './screens/ProcessingScreen.jsx';
import { ResultsScreen } from './screens/ResultsScreen.jsx';

/**
 * Player container. Selects the right screen for the authoritative game state
 * and owns the per-round "already submitted" guard.
 */
export const PlayerView = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { room, identity, connected, remaining, lastScore, leaveGame } = useGame();
  const [submitted, setSubmitted] = useState(false);
  const lastRoundRef = useRef(null);

  // Redirect to join if there's no player session at all.
  useEffect(() => {
    if (!identity || identity.role !== 'player') navigate('/join', { replace: true });
  }, [identity, navigate]);

  // Reset the one-shot submission guard whenever a new round begins.
  const roomState = room?.state;
  const currentRound = room?.currentRound;
  useEffect(() => {
    if (roomState === GameState.ROUND_STARTING && lastRoundRef.current !== currentRound) {
      lastRoundRef.current = currentRound;
      setSubmitted(false);
    }
  }, [roomState, currentRound]);

  const onSubmit = useCallback(
    async (blob) => {
      try {
        await apiClient.submitImage(identity.code, identity.playerId, blob);
        setSubmitted(true);
        toast.success('Submitted — awaiting AI score');
      } catch (err) {
        toast.error(err.message ?? 'Submission failed');
      }
    },
    [identity, toast],
  );

  if (!identity || identity.role !== 'player') return null;

  if (!room || room.code !== identity.code) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center gap-4 pt-32">
          <Spinner />
          <p className="font-label uppercase tracking-widest text-text-secondary text-sm">
            {connected ? 'Syncing room…' : 'Reconnecting…'}
          </p>
        </div>
      </AppLayout>
    );
  }

  const screen = () => {
    switch (room.state) {
      case GameState.WAITING_ROOM:
      case GameState.NEXT_ROUND:
        return <Lobby room={room} playerId={identity.playerId} />;
      case GameState.ROUND_STARTING:
      case GameState.SEARCHING:
        return (
          <SearchScreen
            room={room}
            remaining={remaining}
            submitted={submitted || room.state === GameState.ROUND_STARTING}
            onSubmit={onSubmit}
            onError={(m) => toast.error(m)}
          />
        );
      case GameState.SUBMISSIONS_CLOSED:
      case GameState.AI_PROCESSING:
        return <ProcessingScreen submitted={submitted} />;
      case GameState.RESULTS:
        return (
          <ResultsScreen room={room} playerId={identity.playerId} lastScore={lastScore} isFinal={false} />
        );
      case GameState.GAME_FINISHED:
        return (
          <div className="flex flex-col items-center gap-4">
            <ResultsScreen room={room} playerId={identity.playerId} lastScore={lastScore} isFinal />
            <Button
              variant="ghost"
              onClick={() => {
                leaveGame();
                navigate('/');
              }}
            >
              Exit to Home
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-4 max-w-lg mx-auto">
        <span className="font-display text-sm tracking-widest text-text-secondary">
          {identity.name}
        </span>
        <StateBadge state={room.state} />
      </div>
      {screen()}
    </AppLayout>
  );
};
