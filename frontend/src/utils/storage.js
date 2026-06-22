/**
 * Persists session identity so a refresh or reconnect can recover the player's
 * place in a room. Scoped per room code. Uses sessionStorage (per-tab).
 */
const KEY = 'internet-detective:session';

export const saveSession = (session) => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* storage unavailable — non-fatal */
  }
};

export const loadSession = () => {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearSession = () => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
};
