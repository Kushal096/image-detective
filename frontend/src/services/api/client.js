import { API_BASE } from '../config.js';

/**
 * Thin REST client for binary image uploads and room checks. Socket.IO carries
 * all real-time state; this handles the things sockets shouldn't (file uploads).
 */
const postImage = async (path, headers, blob, filename) => {
  const form = new FormData();
  form.append('image', blob, filename);
  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers, body: form });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error ?? 'Request failed');
    err.code = body.code ?? 'ERROR';
    err.status = res.status;
    throw err;
  }
  return body;
};

export const apiClient = {
  /** Host uploads the round's target image. */
  uploadTarget: (code, hostId, blob) =>
    postImage(`/rooms/${code}/target`, { 'x-host-id': hostId }, blob, 'target.jpg'),

  /** Player submits their candidate image for scoring. */
  submitImage: (code, playerId, blob) =>
    postImage(`/rooms/${code}/submit`, { 'x-player-id': playerId }, blob, 'submission.jpg'),

  /** Checks whether a room exists and is open to joins. */
  async roomExists(code) {
    const res = await fetch(`${API_BASE}/rooms/${code}/exists`);
    if (!res.ok) return { exists: false, open: false };
    return res.json();
  },
};
