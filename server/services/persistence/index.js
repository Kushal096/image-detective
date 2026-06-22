import { env, isFirebaseConfigured } from '../../config/env.js';
import { InMemoryStore } from './InMemoryStore.js';
import { FirestoreStore } from './FirestoreStore.js';
import { createLogger } from '../../utils/logger.js';

const log = createLogger('persistence');

/**
 * Resolves the active persistence backend. Falls back to in-memory storage when
 * Firebase credentials are absent or initialization fails, so the game always
 * runs. The returned object always satisfies { saveGame, getGame }.
 */
export const createPersistenceStore = async () => {
  if (!isFirebaseConfigured) {
    log.warn('Firebase not configured — using in-memory persistence');
    return new InMemoryStore();
  }
  try {
    return await FirestoreStore.create(env.firebase);
  } catch (err) {
    log.error('Firestore init failed, falling back to in-memory', err.message);
    return new InMemoryStore();
  }
};
