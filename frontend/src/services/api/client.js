import { API_BASE } from "../config.js";

/**
 * Thin REST client for binary image uploads and room checks. Socket.IO carries
 * all real-time state; this handles the things sockets shouldn't (file uploads).
 */
const postImage = async (path, headers, blob, filename, extraFields = {}) => {
  const form = new FormData();
  form.append("image", blob, filename);
  for (const [key, value] of Object.entries(extraFields)) {
    if (value !== undefined && value !== null) {
      form.append(
        key,
        typeof value === "string" ? value : JSON.stringify(value),
      );
    }
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: form,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error ?? "Request failed");
    err.code = body.code ?? "ERROR";
    err.status = res.status;
    throw err;
  }
  return body;
};

export const apiClient = {
  /** Host uploads the round's target image with optional player-hint crop/blur settings. */
  uploadTarget: (code, hostId, blob, hintConfig, roundIndex, subRoundIndex) => {
    const extraFields = {};
    if (hintConfig) extraFields.hintConfig = hintConfig;
    if (roundIndex !== undefined && roundIndex !== null)
      extraFields.roundIndex = roundIndex;
    if (subRoundIndex !== undefined && subRoundIndex !== null)
      extraFields.subRoundIndex = subRoundIndex;
    return postImage(
      `/rooms/${code}/target`,
      { "x-host-id": hostId },
      blob,
      "target.jpg",
      extraFields,
    );
  },

  /** Player submits their candidate image for scoring. */
  submitImage: (code, playerId, blob) =>
    postImage(
      `/rooms/${code}/submit`,
      { "x-player-id": playerId },
      blob,
      "submission.jpg",
    ),

  /** Checks whether a room exists and is open to joins. */
  async roomExists(code) {
    const res = await fetch(`${API_BASE}/rooms/${code}/exists`);
    if (!res.ok) return { exists: false, open: false };
    return res.json();
  },
};
