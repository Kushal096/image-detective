import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn.js';

const CONFIG = {
  success: { icon: CheckCircle2, tone: 'border-primary/50 text-primary' },
  warning: { icon: AlertTriangle, tone: 'border-warning/50 text-warning' },
  error: { icon: XCircle, tone: 'border-danger/50 text-danger' },
  info: { icon: Info, tone: 'border-secondary/50 text-secondary' },
};

/** Fixed top-right toast stack. Rendered once by ToastProvider. */
export const Toaster = ({ toasts, onDismiss }) => (
  <div
    className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-[min(92vw,340px)]"
    role="region"
    aria-label="Notifications"
  >
    {toasts.map(({ id, message, type }) => {
      const { icon: Icon, tone } = CONFIG[type] ?? CONFIG.info;
      return (
        <div
          key={id}
          role="status"
          className={cn(
            'animate-scale-in bg-surface border rounded-sm px-3 py-2.5 flex items-start gap-2.5',
            'shadow-lg shadow-black/40',
            tone,
          )}
        >
          <Icon className="size-4 mt-0.5 shrink-0" aria-hidden />
          <p className="font-body text-xs text-text flex-1 break-words">{message}</p>
          <button
            type="button"
            onClick={() => onDismiss(id)}
            aria-label="Dismiss notification"
            className="text-text-muted hover:text-text transition-colors"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      );
    })}
  </div>
);
