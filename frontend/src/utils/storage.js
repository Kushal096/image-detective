/**
 * Persists session identity so a refresh or reconnect can recover the player's
 * place in a room. Uses localStorage keyed by room code so sessions survive
 * tab backgrounding and browser restarts within the same device.
 */
const KEY_PREFIX = "internet-detective:session:";

export const saveSession = (session) => {
  if (!session?.code) return;
  try {
    localStorage.setItem(
      `${KEY_PREFIX}${session.code}`,
      JSON.stringify(session),
    );
  } catch {
    /* storage unavailable — non-fatal */
  }
};

export const loadSession = (code) => {
  try {
    const key = code ? `${KEY_PREFIX}${code}` : null;
    if (key) {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    }
    // Fallback: scan for any player session (single active game assumption).
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k?.startsWith(KEY_PREFIX)) continue;
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (parsed?.role === "player") return parsed;
    }
    return null;
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
