import { Trophy } from "lucide-react";
import { Card, CardHeader } from "../../../components/ui/Card.jsx";
import { Leaderboard } from "../../../components/game/Leaderboard.jsx";
import { GameState } from "../../../services/socket/events.js";

/**
 * Per-round results for the player. Shows only their own name and score
 * for the current round — no leaderboard or cumulative totals.
 */
export const ResultsScreen = ({ room, playerId, lastScore, isFinal }) => {
  const me = room.leaderboard.find((e) => e.playerId === playerId);
  const roundScore = lastScore?.score ?? me?.roundScore;
  const roundTitle = room.currentRoundTitle || room.currentRoundGroupTitle;
  const showOriginal =
    room.targetPreview &&
    (room.state === GameState.RESULTS ||
      room.state === GameState.GAME_FINISHED);

  return (
    <div className="max-w-md mx-auto pt-6 flex flex-col gap-4 animate-fade-in">
      {showOriginal && (
        <Card className="animate-scale-in">
          <CardHeader title="Original Image" />
          <div className="p-4">
            <img
              src={room.targetPreview}
              alt="Original target"
              className="w-full h-auto rounded-lg border border-border"
            />
            <p className="font-body text-xs text-text-muted text-center mt-2">
              This was the target image for this round
            </p>
          </div>
        </Card>
      )}

      {isFinal && (
        <Card glow="primary" className="text-center py-6 animate-scale-in">
          <Trophy className="size-8 text-primary mx-auto mb-2" aria-hidden />
          <h2 className="font-display text-2xl">GAME OVER</h2>
          <p className="font-body text-sm text-text-secondary mt-1">
            Thanks for playing!
          </p>
        </Card>
      )}

      {me && !isFinal && (
        <Card glow="secondary" className="text-center py-6">
          {roundTitle && (
            <p className="font-label text-[10px] uppercase tracking-widest text-text-muted mb-2">
              {roundTitle}
            </p>
          )}
          <p className="font-body text-lg text-text mb-1">{me.name}</p>
          <p className="font-display text-5xl text-primary tabular-nums">
            {roundScore != null ? roundScore : "—"}
          </p>
          <p className="font-label text-[10px] uppercase tracking-widest text-text-muted mt-2">
            Your score this round
          </p>
        </Card>
      )}

      {isFinal && me && (
        <Card glow="secondary" className="text-center py-6">
          <p className="font-body text-lg text-text mb-1">{me.name}</p>
          <p className="font-display text-4xl text-primary tabular-nums">
            {roundScore != null ? roundScore : (me.roundScore ?? "—")}
          </p>
          <p className="font-label text-[10px] uppercase tracking-widest text-text-muted mt-2">
            Last round score
          </p>
        </Card>
      )}
      {isFinal && room.leaderboard.length > 0 && (
        <Card>
          <CardHeader title="Final Standings" />
          <Leaderboard
            entries={room.leaderboard}
            highlightId={playerId}
            crownWinner
          />
        </Card>
      )}
    </div>
  );
};
