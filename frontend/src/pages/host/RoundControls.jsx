import { Play, SkipForward, ChevronRight, Flag, Loader2 } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Timer } from '../../components/game/Timer.jsx';
import { GameState } from '../../services/socket/events.js';

/**
 * State-driven host round controls. Renders only the actions valid for the
 * current authoritative game state, so the host can never desync the server.
 */
export const RoundControls = ({ room, remaining, actions }) => {
  const { state, hasTarget, players, currentRound, totalRounds, roundSeconds } = room;
  const isLastRound = currentRound >= totalRounds;
  const canStart = hasTarget && players.length > 0;

  return (
    <Card glow="primary">
      <CardHeader title="Round Control" subtitle={`Round ${currentRound} of ${totalRounds}`} icon={Flag} />

      {(state === GameState.SEARCHING || state === GameState.ROUND_STARTING) && (
        <div className="mb-5 flex justify-center">
          <Timer remaining={remaining} total={roundSeconds} />
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {state === GameState.WAITING_ROOM && (
          <>
            <Button size="lg" disabled={!canStart} onClick={actions.startRound} className="w-full">
              <Play className="size-4" /> Start Round
            </Button>
            {!hasTarget && (
              <p className="font-body text-xs text-warning text-center">Set a target image first</p>
            )}
            {hasTarget && players.length === 0 && (
              <p className="font-body text-xs text-warning text-center">Waiting for players to join</p>
            )}
          </>
        )}

        {state === GameState.ROUND_STARTING && (
          <p className="font-label uppercase tracking-widest text-warning text-center py-2">
            Round starting…
          </p>
        )}

        {state === GameState.SEARCHING && (
          <Button variant="danger" size="md" onClick={actions.skipRound} className="w-full">
            <SkipForward className="size-4" /> End Round Early
          </Button>
        )}

        {(state === GameState.SUBMISSIONS_CLOSED || state === GameState.AI_PROCESSING) && (
          <p className="flex items-center justify-center gap-2 font-label uppercase tracking-widest text-secondary py-2">
            <Loader2 className="size-4 animate-spin-slow" /> Analyzing submissions…
          </p>
        )}

        {state === GameState.RESULTS && (
          <Button size="lg" onClick={actions.nextRound} className="w-full">
            {isLastRound ? (
              <>
                <Flag className="size-4" /> Finish Game
              </>
            ) : (
              <>
                <ChevronRight className="size-4" /> Next Round
              </>
            )}
          </Button>
        )}

        {state !== GameState.GAME_FINISHED && (
          <Button variant="ghost" size="sm" onClick={actions.endGame} className="w-full">
            End Game
          </Button>
        )}
      </div>
    </Card>
  );
};
