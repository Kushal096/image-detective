import { createContext, useContext } from 'react';

/**
 * Toast context object + consumer hook, separated from the provider component
 * for Fast-Refresh friendliness.
 */
export const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
