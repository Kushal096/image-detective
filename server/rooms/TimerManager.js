/**
 * Owns authoritative per-room countdown timers. The server ticks once per second
 * and invokes callbacks; clients only ever render the broadcast value, never
 * their own clock. Guarantees a single active timer per room.
 */
export class TimerManager {
  #timers = new Map(); // roomCode -> intervalId

  /**
   * Starts a 1Hz countdown for a room.
   * @param {string} roomCode
   * @param {() => number} getRemaining returns seconds left (server computed)
   * @param {(remaining: number) => void} onTick
   * @param {() => void} onExpire
   */
  start(roomCode, { getRemaining, onTick, onExpire }) {
    this.clear(roomCode);
    const interval = setInterval(() => {
      const remaining = getRemaining();
      onTick(remaining);
      if (remaining <= 0) {
        this.clear(roomCode);
        onExpire();
      }
    }, 1000);
    this.#timers.set(roomCode, interval);
  }

  clear(roomCode) {
    const interval = this.#timers.get(roomCode);
    if (interval) {
      clearInterval(interval);
      this.#timers.delete(roomCode);
    }
  }

  clearAll() {
    for (const interval of this.#timers.values()) clearInterval(interval);
    this.#timers.clear();
  }
}

export const timerManager = new TimerManager();
