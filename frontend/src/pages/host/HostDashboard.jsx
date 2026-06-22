import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { AppLayout } from '../../layouts/AppLayout.jsx';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { Leaderboard } from '../../components/game/Leaderboard.jsx';
import { StateBadge } from '../../components/game/StateBadge.jsx';
import { useGame } from '../../contexts/gameContext.js';
import { GameState } from '../../services/socket/events.js';
import { RoomInfoCard } from './RoomInfoCard.jsx';
import { TargetControl } from './TargetControl.jsx';
import { RoundControls } from './RoundControls.jsx';

const ROUND_ACTIVE = new Set([
  GameState.ROUND_STARTING,
  GameState.SEARCHING,
  GameState.SUBMISSIONS_CLOSED,
  GameState.AI_PROCESSING,
]);

/**
 * Host command center. Creates a room on entry, then orchestrates targets,
 * rounds, players, and the live leaderboard — all driven by server snapshots.
 */
export const HostDashboard = () => {
  const navigate = useNavigate();
  const { room, identity, connected, remaining, createRoom, startRound, skipRound, nextRound, endGame } =
    useGame();
  const createdRef = useRef(false);

  // Create a fresh room once on entry (guarded against StrictMode double-run).
  useEffect(() => {
    if (createdRef.current) return;
    createdRef.current = true;
    createRoom({}).catch(() => {
      createdRef.current = false;
    });
  }, [createRoom]);

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

  const locked = ROUND_ACTIVE.has(room.state);
  const isFinished = room.state === GameState.GAME_FINISHED;

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-xl tracking-widest">HOST CONSOLE</h1>
          <StateBadge state={room.state} />
        </div>
      </div>

      {isFinished ? (
        <FinalResults room={room} onExit={() => navigate('/')} onNewGame={() => window.location.reload()} />
      ) : (
        <div className="grid lg:grid-cols-3 gap-4 items-start">
          {/* Left column: access + players */}
          <div className="flex flex-col gap-4">
            <RoomInfoCard code={code} />
            <Card>
              <CardHeader
                title="Players"
                subtitle={`${room.players.length} connected`}
                icon={Users}
              />
              {room.players.length === 0 ? (
                <p className="font-body text-sm text-text-muted text-center py-4">
                  Waiting for detectives…
                </p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {room.players.map((p) => (
                    <li
                      key={p.id}
                      className="font-body text-xs px-2.5 py-1 rounded-xs border border-border bg-elevated text-text-secondary"
                    >
                      {p.name}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* Middle column: target + controls */}
          <div className="flex flex-col gap-4">
            <TargetControl
              code={code}
              hostId={identity.hostId}
              targetPreview={room.targetPreview}
              hasTarget={room.hasTarget}
              locked={locked}
            />
            <RoundControls
              room={room}
              remaining={remaining}
              actions={{ startRound, skipRound, nextRound, endGame }}
            />
          </div>

          {/* Right column: live leaderboard */}
          <Card glow="secondary">
            <CardHeader title="Leaderboard" subtitle="Live rankings" />
            <Leaderboard entries={room.leaderboard} crownWinner={room.state === GameState.RESULTS} />
          </Card>
        </div>
      )}
    </AppLayout>
  );
};

/** Inline final-results panel shown on the host console when the game ends. */
const FinalResults = ({ room, onExit, onNewGame }) => (
  <Card glow="primary" className="max-w-2xl mx-auto animate-scale-in">
    <h2 className="font-display text-2xl text-center mb-1">GAME OVER</h2>
    <p className="font-body text-sm text-text-secondary text-center mb-6">
      {room.leaderboard[0] ? `${room.leaderboard[0].name} wins the investigation` : 'No winner'}
    </p>
    <Leaderboard entries={room.leaderboard} crownWinner />
    <div className="flex gap-3 mt-6">
      <button
        type="button"
        onClick={onNewGame}
        className="flex-1 font-label uppercase tracking-wider text-sm py-2.5 rounded-sm bg-primary text-bg hover:shadow-[var(--shadow-glow)]"
      >
        New Game
      </button>
      <button
        type="button"
        onClick={onExit}
        className="flex-1 font-label uppercase tracking-wider text-sm py-2.5 rounded-sm border border-border text-text-secondary hover:bg-elevated"
      >
        Exit
      </button>
    </div>
  </Card>
);
