import { cn } from '../../utils/cn.js';

/**
 * Themed button. Variants map to the design system (primary/secondary/danger/
 * ghost). Always renders a real <button> for accessibility.
 */
const VARIANTS = {
  primary:
    'bg-primary text-bg hover:shadow-[var(--shadow-glow)] border border-primary disabled:opacity-40',
  secondary:
    'bg-transparent text-secondary border border-secondary hover:bg-secondary/10 hover:shadow-[var(--shadow-glow-blue)]',
  danger:
    'bg-danger text-white border border-danger hover:shadow-[var(--shadow-glow-danger)] disabled:opacity-40',
  ghost: 'bg-transparent text-text-secondary border border-transparent hover:text-text hover:bg-elevated',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

export const Button = ({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  loading = false,
  disabled,
  children,
  ...props
}) => (
  <button
    type={type}
    disabled={disabled || loading}
    className={cn(
      'font-label uppercase tracking-wider rounded-sm transition-all duration-150',
      'inline-flex items-center justify-center gap-2 cursor-pointer select-none',
      'disabled:cursor-not-allowed active:scale-[0.98]',
      VARIANTS[variant],
      SIZES[size],
      className,
    )}
    {...props}
  >
    {loading && (
      <span className="size-3.5 rounded-full border-2 border-current border-t-transparent animate-spin-slow" />
    )}
    {children}
  </button>
);
