import { ChevronUp, ChevronDown, Minus, Trophy, Wifi, WifiOff } from 'lucide-react';
import { cn } from '../../utils/cn.js';

/**
 * Animated competitive leaderboard. Rows reorder with a FLIP-style layout
 * transition driven by each entry's stable key + CSS transform, and movement
 * arrows reflect server-computed rank deltas.
 */
const MOVEMENT = {
  up: { icon: ChevronUp, className: 'text-primary' },
  down: { icon: ChevronDown, className: 'text-danger' },
  same: { icon: Minus, className: 'text-text-muted' },
};

const Row = ({ entry, highlightId, isWinner }) => {
  const Move = MOVEMENT[entry.movement] ?? MOVEMENT.same;
  const isYou = entry.playerId === highlightId;
  return (
    <li
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-sm border transition-all duration-300',
        'bg-elevated/60 border-border',
        isYou && 'border-secondary/60 bg-secondary/5',
        isWinner && 'border-primary/70 shadow-[var(--shadow-glow)] bg-primary/5',
      )}
    >
      <span
        className={cn(
          'font-display text-lg w-8 text-center tabular-nums',
          isWinner ? 'text-primary' : 'text-text-secondary',
        )}
      >
        {entry.rank}
      </span>
      <Move.icon className={cn('size-4 shrink-0', Move.className)} aria-hidden />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {isWinner && <Trophy className="size-4 text-primary shrink-0" aria-hidden />}
          <span className="font-body text-sm text-text truncate">{entry.name}</span>
          {isYou && <span className="font-label text-[10px] text-secondary">YOU</span>}
          {entry.connected ? (
            <Wifi className="size-3 text-primary/60 shrink-0" aria-label="connected" />
          ) : (
            <WifiOff className="size-3 text-danger/60 shrink-0" aria-label="disconnected" />
          )}
        </div>
      </div>
      {entry.roundScore != null && (
        <span className="font-label text-xs text-primary">+{entry.roundScore}</span>
      )}
      <span className="font-display text-lg tabular-nums text-text w-14 text-right">
        {entry.totalScore}
      </span>
    </li>
  );
};

export const Leaderboard = ({ entries = [], highlightId, crownWinner = false, emptyLabel }) => {
  if (!entries.length) {
    return (
      <p className="font-body text-sm text-text-muted text-center py-6">
        {emptyLabel ?? 'No players yet'}
      </p>
    );
  }
  return (
    <ol className="flex flex-col gap-2">
      {entries.map((entry) => (
        <Row
          key={entry.playerId}
          entry={entry}
          highlightId={highlightId}
          isWinner={crownWinner && entry.rank === 1}
        />
      ))}
    </ol>
  );
};
