import { useId } from 'react';
import { cn } from '../../utils/cn.js';

/**
 * Labeled text input with the terminal aesthetic and inline validation message.
 * Wires label/input/error together for screen readers.
 */
export const Input = ({ label, error, hint, className, id, ...props }) => {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="font-label text-xs uppercase tracking-widest text-text-secondary">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'bg-bg border border-border rounded-sm px-3 py-2.5 font-body text-sm text-text',
          'placeholder:text-text-muted transition-colors duration-150',
          'focus:border-primary focus:outline-none',
          error && 'border-danger focus:border-danger',
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={errorId} className="font-body text-xs text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="font-body text-xs text-text-muted">{hint}</p>
      )}
    </div>
  );
};
