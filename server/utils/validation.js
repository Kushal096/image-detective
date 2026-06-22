/**
 * Input validation helpers. Pure functions, no side effects.
 * All user-facing input must pass through these before mutating game state.
 */

const USERNAME_MIN = 2;
const USERNAME_MAX = 20;
const USERNAME_PATTERN = /^[\p{L}\p{N} _.-]+$/u;
const ROOM_CODE_PATTERN = /^[A-Z0-9]{6}$/;

export const sanitizeUsername = (raw) => {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  if (trimmed.length < USERNAME_MIN || trimmed.length > USERNAME_MAX) return null;
  if (!USERNAME_PATTERN.test(trimmed)) return null;
  return trimmed;
};

export const isValidRoomCode = (raw) =>
  typeof raw === 'string' && ROOM_CODE_PATTERN.test(raw.trim().toUpperCase());

export const normalizeRoomCode = (raw) =>
  typeof raw === 'string' ? raw.trim().toUpperCase() : '';

/** Validates a decoded image buffer's declared mime type. */
export const isAllowedMime = (mime, allowed) => allowed.includes(mime);
