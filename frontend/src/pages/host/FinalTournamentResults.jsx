import { Trophy, Medal, Award, TrendingUp, Zap, Clock } from 'lucide-react';
import { AppLayout } from '../../layouts/AppLayout.jsx';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Leaderboard } from '../../components/game/Leaderboard.jsx';
import { useGame } from '../../contexts/gameContext.js';
import { cn } from '../../utils/cn.js';

/**
 * Final Tournament Results - Displays the champion, podium, full leaderboard,
 * and tournament statistics. Shows confetti animation for the winner.
 */
export const FinalTournamentResults = ({ onExit, onNewGame }) => {
  const { room } = useGame();

  if (!room) return null;

  const { leaderboard } = room;
  const champion = leaderboard[0];
  const secondPlace = leaderboard[1];
  const thirdPlace = leaderboard[2];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        {/* Confetti animation for winner */}
        {champion && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            <Confetti />
          </div>
        )}

        {/* Tournament Champion */}
        <Card glow="primary" className="mb-6 animate-scale-in">
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 border-2 border-primary mb-4 animate-pulse">
              <Trophy className="size-10 text-primary" />
            </div>
            <h1 className="font-display text-4xl tracking-widest mb-2 text-primary">
              TOURNAMENT CHAMPION
            </h1>
            {champion ? (
              <>
                <p className="font-display text-6xl tracking-wider mb-4">{champion.name}</p>
                <p className="font-body text-2xl text-text-secondary">
                  Final Score: <span className="text-primary font-display">{champion.totalScore}</span>
                </p>
              </>
            ) : (
              <p className="font-body text-lg text-text-muted">No players participated</p>
            )}
          </div>
        </Card>

        {/* Podium */}
        {(secondPlace || thirdPlace) && (
          <Card glow="secondary" className="mb-6">
            <CardHeader title="Podium" subtitle="Top 3 finishers" />
            <div className="grid md:grid-cols-3 gap-4">
              {/* Second Place */}
              {secondPlace && (
                <PodiumCard
                  place={2}
                  player={secondPlace}
                  icon={Medal}
                  color="text-text-secondary"
                  bgColor="bg-text-secondary/10"
                  borderColor="border-text-secondary/30"
                />
              )}

              {/* Champion (center) */}
              {champion && (
                <PodiumCard
                  place={1}
                  player={champion}
                  icon={Trophy}
                  color="text-primary"
                  bgColor="bg-primary/10"
                  borderColor="border-primary/30"
                  featured
                />
              )}

              {/* Third Place */}
              {thirdPlace && (
                <PodiumCard
                  place={3}
                  player={thirdPlace}
                  icon={Award}
                  color="text-warning"
                  bgColor="bg-warning/10"
                  borderColor="border-warning/30"
                />
              )}
            </div>
          </Card>
        )}

        {/* Full Leaderboard */}
        <Card glow="secondary" className="mb-6">
          <CardHeader title="Final Standings" subtitle={`${leaderboard.length} players`} />
          <Leaderboard entries={leaderboard} crownWinner emptyLabel="No players participated" />
        </Card>

        {/* Tournament Statistics */}
        <Card className="mb-6">
          <CardHeader title="Tournament Statistics" icon={TrendingUp} />
          <TournamentStats leaderboard={leaderboard} room={room} />
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button variant="primary" size="lg" onClick={onNewGame} className="flex-1">
            New Tournament
          </Button>
          <Button variant="secondary" size="lg" onClick={onExit} className="flex-1">
            Exit to Home
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

/**
 * Podium card for top 3 players
 */
const PodiumCard = ({ place, player, icon: Icon, color, bgColor, borderColor, featured }) => (
  <div
    className={cn(
      'p-4 rounded-sm border text-center transition-all',
      bgColor,
      borderColor,
      featured && 'md:order-2 scale-105'
    )}
  >
    <div className={cn('inline-flex items-center justify-center w-12 h-12 rounded-full mb-3', bgColor)}>
      <Icon className={cn('size-6', color)} />
    </div>
    <p className={cn('font-display text-5xl mb-1', color)}>{place}</p>
    <p className="font-display text-xl mb-2">{player.name}</p>
    <p className="font-body text-sm text-text-secondary">
      Score: <span className={cn('font-display', color)}>{player.totalScore}</span>
    </p>
  </div>
);

/**
 * Tournament statistics display
 */
const TournamentStats = ({ leaderboard, room }) => {
  if (leaderboard.length === 0) {
    return (
      <p className="font-body text-sm text-text-muted text-center py-4">
        No statistics available
      </p>
    );
  }

  const totalPlayers = leaderboard.length;
  const totalScore = leaderboard.reduce((sum, p) => sum + p.totalScore, 0);
  const avgScore = Math.round(totalScore / totalPlayers);
  const highestScore = leaderboard[0]?.totalScore || 0;
  const lowestScore = leaderboard[leaderboard.length - 1]?.totalScore || 0;

  const stats = [
    { icon: Trophy, label: 'Total Players', value: totalPlayers, color: 'text-primary' },
    { icon: TrendingUp, label: 'Average Score', value: avgScore, color: 'text-secondary' },
    { icon: Zap, label: 'Highest Score', value: highestScore, color: 'text-primary' },
    { icon: Clock, label: 'Rounds Played', value: room.currentRound || 0, color: 'text-secondary' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, idx) => (
        <div key={idx} className="text-center p-4 rounded-sm bg-elevated/50 border border-border">
          <stat.icon className={cn('size-6 mx-auto mb-2', stat.color)} />
          <p className="font-label text-[10px] uppercase tracking-widest text-text-muted mb-1">
            {stat.label}
          </p>
          <p className={cn('font-display text-2xl', stat.color)}>{stat.value}</p>
        </div>
      ))}
    </div>
  );
};

/**
 * Simple confetti animation using CSS
 */
const Confetti = () => {
  const pieces = Array.from({ length: 50 }, (_, i) => i);

  return (
    <div className="absolute inset-0">
      {pieces.map((i) => (
        <div
          key={i}
          className="absolute w-2 h-2 opacity-70 animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-10px',
            backgroundColor: ['#00FF88', '#FF0080', '#00D4FF', '#FFD700'][Math.floor(Math.random() * 4)],
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${3 + Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
  );
};
