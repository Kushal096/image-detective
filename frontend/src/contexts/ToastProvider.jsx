import { useCallback, useMemo, useState } from 'react';
import { Toaster } from '../components/ui/Toaster.jsx';
import { ToastContext } from './toastContext.js';

let nextId = 0;

/**
 * Provides transient toast notifications. Toasts auto-dismiss; the Toaster
 * component renders them in a fixed top-right stack.
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, { type = 'info', duration = 3500 } = {}) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, message, type }]);
      if (duration > 0) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss],
  );

  const toast = useMemo(
    () => ({
      info: (m, o) => push(m, { ...o, type: 'info' }),
      success: (m, o) => push(m, { ...o, type: 'success' }),
      warning: (m, o) => push(m, { ...o, type: 'warning' }),
      error: (m, o) => push(m, { ...o, type: 'error' }),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};
