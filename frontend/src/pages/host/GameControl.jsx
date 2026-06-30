import { useState } from "react";
import {
  Play,
  SkipForward,
  ChevronRight,
  Flag,
  Loader2,
  Users,
  Eye,
  EyeOff,
} from "lucide-react";
import { AppLayout } from "../../layouts/AppLayout.jsx";
import { Card, CardHeader } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Timer } from "../../components/game/Timer.jsx";
import { RoundResults } from "../../components/game/RoundResults.jsx";
import { RoomInfoCard } from "./RoomInfoCard.jsx";
import { useGame } from "../../contexts/gameContext.js";
import { GameState } from "../../services/socket/events.js";
import { cn } from "../../utils/cn.js";

const PlayersList = ({
  players,
  emptyLabel = "No players have joined yet",
}) => {
  if (players.length === 0) {
    return (
      <p className="font-body text-sm text-text-muted text-center py-6">
        {emptyLabel}
      </p>
    );
  }
  return (
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
  );
};

/**
 * Game Control page - Screen-share friendly control panel.
 * Never displays future target images, scores, or hidden information.
 */
export const GameControl = () => {
  const {
    room,
    remaining,
    startRound,
    skipRound,
    nextRound,
    endGame,
    identity,
  } = useGame();
  const [showJoinInfo, setShowJoinInfo] = useState(false);

  if (!room) return null;

  const {
    state,
    currentRound,
    totalRounds,
    roundSeconds,
    players,
    currentRoundTitle,
    currentRoundGroupTitle,
    currentSubRound,
  } = room;

  const roundLabel = currentRoundTitle
    ? currentRoundGroupTitle
      ? `${currentRoundGroupTitle}: ${currentRoundTitle}`
      : currentRoundTitle
    : `Round ${currentRound}`;

  const isLastRound = currentRound >= totalRounds;
  const isSearching =
    state === GameState.SEARCHING || state === GameState.ROUND_STARTING;
  const isProcessing =
    state === GameState.SUBMISSIONS_CLOSED || state === GameState.AI_PROCESSING;
  const isResults = state === GameState.RESULTS;
  const canStart = players.length > 0;
  const shouldShowJoinInfo = state === GameState.WAITING_ROOM || showJoinInfo;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-display text-xl tracking-widest mb-1">
              GAME CONTROL
            </h1>
            <p className="font-body text-sm text-text-secondary">
              {roundLabel} ({currentRound} of {totalRounds}) • {players.length}{" "}
              player
              {players.length !== 1 ? "s" : ""}
            </p>
          </div>
          {state !== GameState.WAITING_ROOM && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowJoinInfo(!showJoinInfo)}
            >
              {showJoinInfo ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
              {showJoinInfo ? "Hide" : "Show"} Join Info
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-12 gap-4">
          {shouldShowJoinInfo && (
            <div className="lg:col-span-3 space-y-4">
              <RoomInfoCard code={identity?.code} />
              <Card>
                <CardHeader
                  title="Players"
                  subtitle={`${players.length} joined`}
                  icon={Users}
                />
                <PlayersList
                  players={players}
                  emptyLabel="Waiting for players..."
                />
              </Card>
            </div>
          )}

          <div
            className={cn(
              "space-y-4",
              shouldShowJoinInfo ? "lg:col-span-9" : "lg:col-span-12",
            )}
          >
            <Card glow="primary">
              <CardHeader
                title="Round Control"
                subtitle={roundLabel}
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
                    <Button
                      size="lg"
                      disabled={!canStart}
                      onClick={startRound}
                      className="w-full"
                    >
                      <Play className="size-4" /> Start {roundLabel}
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
                  <Button
                    variant="danger"
                    size="md"
                    onClick={skipRound}
                    className="w-full"
                  >
                    <SkipForward className="size-4" /> End Round Early
                  </Button>
                )}

                {isProcessing && (
                  <p className="flex items-center justify-center gap-2 font-label uppercase tracking-widest text-secondary py-2">
                    <Loader2 className="size-4 animate-spin-slow" /> Analyzing
                    submissions…
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
                        <ChevronRight className="size-4" /> Next Round
                      </>
                    )}
                  </Button>
                )}

                {state !== GameState.GAME_FINISHED && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={endGame}
                    className="w-full"
                  >
                    End Tournament
                  </Button>
                )}
              </div>
            </Card>

            {isResults && currentSubRound ? (
              <RoundResults
                round={currentSubRound}
                players={players}
                targetImage={currentSubRound.targetPreview}
              />
            ) : (
              <Card glow="secondary" className="min-h-[200px]">
                <CardHeader
                  title="Joined Players"
                  subtitle="Detectives in the room"
                  icon={Users}
                />
                <PlayersList players={players} />
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
