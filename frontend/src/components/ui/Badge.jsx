import { cn } from '../../utils/cn.js';

const TONES = {
  neutral: 'text-text-secondary border-border bg-elevated',
  primary: 'text-primary border-primary/40 bg-primary/10',
  secondary: 'text-secondary border-secondary/40 bg-secondary/10',
  warning: 'text-warning border-warning/40 bg-warning/10',
  danger: 'text-danger border-danger/40 bg-danger/10',
};

/** Small status pill using the label typeface. */
export const Badge = ({ tone = 'neutral', className, children }) => (
  <span
    className={cn(
      'font-label text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-xs border',
      TONES[tone],
      className,
    )}
  >
    {children}
  </span>
);
