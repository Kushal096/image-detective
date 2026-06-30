/**
 * Persists session identity so a refresh or reconnect can recover host/player
 * place in a room. Uses localStorage keyed by room code.
 */
const KEY_PREFIX = "internet-detective:session:";

const scanAllSessions = () => {
  const sessions = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k?.startsWith(KEY_PREFIX)) continue;
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (parsed?.code && parsed?.role) sessions.push(parsed);
    }
  } catch {
    /* ignore corrupt storage */
  }
  return sessions;
};

export const saveSession = (session) => {
  if (!session?.code) return;
  try {
    localStorage.setItem(
      `${KEY_PREFIX}${session.code}`,
      JSON.stringify({ ...session, savedAt: Date.now() }),
    );
  } catch {
    /* storage unavailable — non-fatal */
  }
};

/** Load a saved session, optionally filtered by role (host | player). */
export const loadSession = ({ role } = {}) => {
  try {
    const sessions = scanAllSessions();
    if (role) {
      const match = sessions.find((s) => s.role === role);
      if (match) return match;
      return null;
    }
    // Prefer host session (typically one active game per device).
    return sessions.find((s) => s.role === "host") ?? sessions[0] ?? null;
  } catch {
    return null;
  }
};

export const clearSession = (code) => {
  try {
    if (code) {
      localStorage.removeItem(`${KEY_PREFIX}${code}`);
    } else {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k?.startsWith(KEY_PREFIX)) localStorage.removeItem(k);
      }
    }
  } catch {
    /* noop */
  }
};
