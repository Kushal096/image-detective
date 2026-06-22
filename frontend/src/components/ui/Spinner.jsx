import { cn } from '../../utils/cn.js';

/** Accessible loading spinner. */
export const Spinner = ({ className, label = 'Loading' }) => (
  <span
    role="status"
    aria-label={label}
    className={cn(
      'inline-block size-6 rounded-full border-2 border-primary border-t-transparent animate-spin-slow',
      className,
    )}
  />
);
