import { useState } from 'react';
import { Play, SkipForward, ChevronRight, Flag, Loader2, Users, Eye, EyeOff } from 'lucide-react';
import { AppLayout } from '../../layouts/AppLayout.jsx';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Timer } from '../../components/game/Timer.jsx';
import { Leaderboard } from '../../components/game/Leaderboard.jsx';
import { RoundResults } from '../../components/game/RoundResults.jsx';
import { RoomInfoCard } from './RoomInfoCard.jsx';
import { useGame } from '../../contexts/gameContext.js';
import { GameState } from '../../services/socket/events.js';
import { cn } from '../../utils/cn.js';

/**
 * Game Control page - Screen-share friendly control panel.
 * Never displays future target images or hidden information.
 * Optimized for tournament hosting with live audience.
 */
export const GameControl = () => {
  const { room, remaining, startRound, skipRound, nextRound, endGame, identity } = useGame();
  const [showJoinInfo, setShowJoinInfo] = useState(false);

  if (!room) return null;

  const { state, currentRound, totalRounds, roundSeconds, players, leaderboard } = room;
  const isLastRound = currentRound >= totalRounds;
  const isSearching = state === GameState.SEARCHING || state === GameState.ROUND_STARTING;
  const isProcessing = state === GameState.SUBMISSIONS_CLOSED || state === GameState.AI_PROCESSING;
  const isResults = state === GameState.RESULTS;
  const canStart = players.length > 0;

  // Show join info automatically before game starts, then hide during gameplay
  const shouldShowJoinInfo = state === GameState.WAITING_ROOM || showJoinInfo;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-display text-xl tracking-widest mb-1">GAME CONTROL</h1>
            <p className="font-body text-sm text-text-secondary">
              Round {currentRound} of {totalRounds} • {players.length} player{players.length !== 1 ? 's' : ''}
            </p>
          </div>
          {state !== GameState.WAITING_ROOM && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowJoinInfo(!showJoinInfo)}
            >
              {showJoinInfo ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              {showJoinInfo ? 'Hide' : 'Show'} Join Info
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-12 gap-4">
          {/* Left sidebar - Room info (collapsible) */}
          {shouldShowJoinInfo && (
            <div className="lg:col-span-3 space-y-4">
              <RoomInfoCard code={identity?.code} />
              <Card>
                <CardHeader title="Players" subtitle={`${players.length} connected`} icon={Users} />
                {players.length === 0 ? (
                  <p className="font-body text-sm text-text-muted text-center py-4">
                    Waiting for players...
                  </p>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {players.map((p) => (
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
          )}

          {/* Main content - Controls and Leaderboard */}
          <div className={cn('space-y-4', shouldShowJoinInfo ? 'lg:col-span-9' : 'lg:col-span-12')}>
            {/* Game Controls */}
            <Card glow="primary">
              <CardHeader
                title="Round Control"
                subtitle={`Round ${currentRound} of ${totalRounds}`}
                icon={Flag}
              />

              {isSearching && (
                <div className="mb-5 flex justify-center">
                  <Timer remaining={remaining} total={roundSeconds} />
                </div>
              )}

              <div className="flex flex-col gap-2.5">
                {state === GameState.WAITING_ROOM && (
                  <>
                    <Button size="lg" disabled={!canStart} onClick={startRound} className="w-full">
                      <Play className="size-4" /> Start Round {currentRound}
                    </Button>
                    {players.length === 0 && (
                      <p className="font-body text-xs text-warning text-center">
                        Waiting for players to join
                      </p>
                    )}
                  </>
                )}

                {state === GameState.ROUND_STARTING && (
                  <p className="font-label uppercase tracking-widest text-warning text-center py-2">
                    Round starting…
                  </p>
                )}

                {state === GameState.SEARCHING && (
                  <Button variant="danger" size="md" onClick={skipRound} className="w-full">
                    <SkipForward className="size-4" /> End Round Early
                  </Button>
                )}

                {isProcessing && (
                  <p className="flex items-center justify-center gap-2 font-label uppercase tracking-widest text-secondary py-2">
                    <Loader2 className="size-4 animate-spin-slow" /> Analyzing submissions…
                  </p>
                )}

                {isResults && (
                  <Button size="lg" onClick={nextRound} className="w-full">
                    {isLastRound ? (
                      <>
                        <Flag className="size-4" /> Finish Tournament
                      </>
                    ) : (
                      <>
                        <ChevronRight className="size-4" /> Start Round {currentRound + 1}
                      </>
                    )}
                  </Button>
                )}

                {state !== GameState.GAME_FINISHED && (
                  <Button variant="ghost" size="sm" onClick={endGame} className="w-full">
                    End Tournament
                  </Button>
                )}
              </div>
            </Card>

            {/* Live Leaderboard or Round Results */}
            {isResults && room.rounds && room.rounds[room.currentRoundIndex] ? (
              <RoundResults
                round={room.rounds[room.currentRoundIndex]}
                players={players}
                targetImage={room.rounds[room.currentRoundIndex]?.targetPreview}
              />
            ) : (
              <Card glow="secondary" className="min-h-[400px]">
                <CardHeader title="Live Leaderboard" subtitle="Tournament standings" />
                <Leaderboard
                  entries={leaderboard}
                  crownWinner={false}
                  emptyLabel="No players have joined yet"
                />
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
