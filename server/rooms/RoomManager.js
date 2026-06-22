import { Room } from './Room.js';
import { newRoomCode } from '../utils/ids.js';
import { env } from '../config/env.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('rooms');

/**
 * In-memory registry of active rooms. Real-time/transient state lives here
 * (per the SRS); Firestore is used only for persistence of finished games.
 */
export class RoomManager {
  #rooms = new Map(); // code -> Room

  createRoom({ hostId, roundSeconds = env.game.defaultRoundSeconds, totalRounds }) {
    const code = newRoomCode((c) => this.#rooms.has(c));
    const room = new Room({ hostId, code, roundSeconds, totalRounds });
    this.#rooms.set(code, room);
    log.info('room created', { code });
    return room;
  }

  getRoom(code) {
    return this.#rooms.get(code) ?? null;
  }

  destroyRoom(code) {
    if (this.#rooms.delete(code)) {
      log.info('room destroyed', { code });
    }
  }

  get count() {
    return this.#rooms.size;
  }

  /** Iterates active rooms (used for socket/disconnect scans). */
  values() {
    return this.#rooms.values();
  }

  /** Removes rooms idle longer than the configured timeout. */
  reapIdle(now = Date.now()) {
    const reaped = [];
    for (const [code, room] of this.#rooms) {
      if (now - room.lastActivity > env.game.roomIdleTimeoutMs) {
        this.#rooms.delete(code);
        reaped.push(code);
      }
    }
    if (reaped.length) log.info('reaped idle rooms', { reaped });
    return reaped;
  }
}

export const roomManager = new RoomManager();
