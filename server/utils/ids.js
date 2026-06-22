import { v4 as uuidv4 } from 'uuid';

/** Generates a UUID used for player/session identity. */
export const newUuid = () => uuidv4();

const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
const ROOM_CODE_LENGTH = 6;

/**
 * Generates a human-friendly, unambiguous room code (e.g. "K7QP2M").
 * @param {(code: string) => boolean} isTaken - predicate to ensure uniqueness
 */
export const newRoomCode = (isTaken = () => false) => {
  let attempt = 0;
  // Practically never loops more than once, but guard against collisions.
  do {
    let code = '';
    for (let i = 0; i < ROOM_CODE_LENGTH; i += 1) {
      code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
    }
    if (!isTaken(code)) return code;
    attempt += 1;
  } while (attempt < 50);

  // Extremely unlikely fallback.
  return uuidv4().slice(0, ROOM_CODE_LENGTH).toUpperCase();
};
