import { createLogger } from '../../utils/logger.js';

const log = createLogger('persistence:firestore');

/**
 * Persists finished-game records to Firestore using the Admin SDK. Credentials
 * stay server-side (loaded from env). Used ONLY for durable history — never for
 * real-time synchronization (that is Socket.IO's job).
 */
export class FirestoreStore {
  #db;

  constructor(db) {
    this.#db = db;
  }

  /** Factory that initializes the Admin SDK from validated env credentials. */
  static async create(firebaseConfig) {
    const { initializeApp, cert, getApps } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');

    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId: firebaseConfig.projectId,
          clientEmail: firebaseConfig.clientEmail,
          privateKey: firebaseConfig.privateKey,
        }),
      });
    }
    log.info('Firestore initialized', { projectId: firebaseConfig.projectId });
    return new FirestoreStore(getFirestore());
  }

  async saveGame(record) {
    await this.#db.collection('games').doc(record.id).set(record);
    log.info('game persisted (firestore)', { id: record.id });
    return record.id;
  }

  async getGame(id) {
    const snap = await this.#db.collection('games').doc(id).get();
    return snap.exists ? snap.data() : null;
  }
}
