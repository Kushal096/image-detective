import { createLogger } from '../../utils/logger.js';

const log = createLogger('persistence:memory');

/**
 * No-op-ish persistence used when Firebase is not configured, so the whole app
 * runs locally without external dependencies. Implements the same interface as
 * FirestoreStore.
 */
export class InMemoryStore {
  #games = new Map();

  async saveGame(record) {
    this.#games.set(record.id, record);
    log.debug('game persisted (memory)', { id: record.id });
    return record.id;
  }

  async getGame(id) {
    return this.#games.get(id) ?? null;
  }
}
