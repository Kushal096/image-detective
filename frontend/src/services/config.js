/**
 * Centralized client configuration. The server URL is injected at build time
 * via Vite env (VITE_SERVER_URL) and falls back to the local dev server.
 */
export const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:4000';
export const API_BASE = `${SERVER_URL}/api`;
