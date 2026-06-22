import { cn } from '../../utils/cn.js';

/**
 * Surface container with the signature dark panel + thin border + subtle glow.
 * `glow` accent tints the border/shadow to match a semantic context.
 */
const GLOW = {
  none: 'border-border',
  primary: 'border-primary/40 shadow-[var(--shadow-glow)]',
  secondary: 'border-secondary/40 shadow-[var(--shadow-glow-blue)]',
  danger: 'border-danger/40 shadow-[var(--shadow-glow-danger)]',
};

export const Card = ({ glow = 'none', className, children, ...props }) => (
  <div
    className={cn('bg-surface border rounded-md p-5', GLOW[glow], className)}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader = ({ title, subtitle, icon: Icon, action }) => (
  <div className="flex items-start justify-between mb-4">
    <div className="flex items-center gap-2.5">
      {Icon && <Icon className="size-4 text-primary" aria-hidden />}
      <div>
        <h3 className="text-sm uppercase tracking-widest text-text">{title}</h3>
        {subtitle && <p className="font-body text-xs text-text-muted mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);
