import { Trophy } from 'lucide-react';
import { Card, CardHeader } from '../../../components/ui/Card.jsx';
import { Leaderboard } from '../../../components/game/Leaderboard.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';

/**
 * Per-round (and final) results for the player. Highlights the player's own
 * row and the points gained this round.
 */
export const ResultsScreen = ({ room, playerId, lastScore, isFinal }) => {
  const me = room.leaderboard.find((e) => e.playerId === playerId);

  return (
    <div className="max-w-md mx-auto pt-6 flex flex-col gap-4 animate-fade-in">
      {isFinal && (
        <Card glow="primary" className="text-center py-6 animate-scale-in">
          <Trophy className="size-8 text-primary mx-auto mb-2" aria-hidden />
          <h2 className="font-display text-2xl">GAME OVER</h2>
          <p className="font-body text-sm text-text-secondary mt-1">
            {room.leaderboard[0]?.name
              ? `${room.leaderboard[0].name} wins`
              : 'No winner'}
          </p>
        </Card>
      )}

      {me && (
        <Card glow="secondary" className="text-center">
          <p className="font-label text-[10px] uppercase tracking-widest text-text-muted">
            {isFinal ? 'Your final standing' : 'Your standing'}
          </p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <div>
              <p className="font-display text-3xl text-secondary">#{me.rank}</p>
              <p className="font-label text-[10px] uppercase tracking-widest text-text-muted">Rank</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div>
              <p className="font-display text-3xl text-text">{me.totalScore}</p>
              <p className="font-label text-[10px] uppercase tracking-widest text-text-muted">Total</p>
            </div>
            {lastScore && !isFinal && (
              <>
                <div className="w-px h-10 bg-border" />
                <div>
                  <p className="font-display text-3xl text-primary">+{lastScore.score}</p>
                  <p className="font-label text-[10px] uppercase tracking-widest text-text-muted">
                    Round
                  </p>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title={isFinal ? 'Final Rankings' : 'Leaderboard'} action={<Badge tone="primary">Live</Badge>} />
        <Leaderboard entries={room.leaderboard} highlightId={playerId} crownWinner={isFinal} />
      </Card>
    </div>
  );
};
