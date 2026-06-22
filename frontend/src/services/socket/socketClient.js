import { io } from 'socket.io-client';
import { SERVER_URL } from '../config.js';

/**
 * Lazily-created Socket.IO singleton. Auto-reconnect is enabled so transient
 * network drops recover transparently; the GameContext re-syncs session state
 * on reconnect via PLAYER_REJOIN.
 */
let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 4000,
    });
  }
  return socket;
};

/** Promisified emit-with-ack so callers can `await` server responses. */
export const emitWithAck = (event, payload) =>
  new Promise((resolve) => {
    getSocket().emit(event, payload, resolve);
  });
