import { cn } from '../../utils/cn.js';

/**
 * The signature countdown. Color shifts green → yellow → red as time runs out
 * and pulses in the final 5 seconds. Purely presentational — the value is the
 * server-authoritative remaining seconds.
 */
const format = (s) => {
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const Timer = ({ remaining, total }) => {
  const value = Math.max(0, remaining ?? 0);
  const tone =
    value > 15 ? 'text-primary' : value > 10 ? 'text-warning' : 'text-danger';
  const danger = value <= 5 && value > 0;
  const pct = total ? Math.max(0, Math.min(100, (value / total) * 100)) : 0;

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 select-none',
        danger && 'animate-pulse-glow rounded-md p-2',
      )}
      role="timer"
      aria-live="off"
    >
      <span className={cn('font-display text-5xl md:text-6xl tabular-nums', tone)}>
        {format(value)}
      </span>
      <div className="h-1 w-40 bg-border rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-1000 ease-linear',
            value > 15 ? 'bg-primary' : value > 10 ? 'bg-warning' : 'bg-danger',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
