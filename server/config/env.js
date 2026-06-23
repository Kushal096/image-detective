import dotenv from "dotenv";

dotenv.config();

/**
 * Centralized, validated environment configuration.
 * Every other module imports from here rather than reading process.env directly.
 */
const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBool = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction: process.env.NODE_ENV === "production",
  port: toInt(process.env.PORT, 4000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",

  game: {
    defaultRoundSeconds: toInt(process.env.DEFAULT_ROUND_SECONDS, 60),
    maxPlayersPerRoom: toInt(process.env.MAX_PLAYERS_PER_ROOM, 32),
    roomIdleTimeoutMs: toInt(process.env.ROOM_IDLE_TIMEOUT_MS, 30 * 60 * 1000),
  },

  ai: {
    model: process.env.AI_MODEL ?? "Xenova/clip-vit-base-patch32",
    workerConcurrency: toInt(process.env.AI_WORKER_CONCURRENCY, 2),
    mock: toBool(process.env.AI_MOCK, false),
    /** When real CLIP fails, use mock embeddings instead of erroring (dev default). */
    fallbackMock: toBool(
      process.env.AI_FALLBACK_MOCK,
      process.env.NODE_ENV !== "production",
    ),
  },

  uploads: {
    maxBytes: toInt(process.env.MAX_UPLOAD_BYTES, 8 * 1024 * 1024),
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || null,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || null,
    // Support escaped newlines from .env single-line values.
    privateKey: process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      : null,
  },
};

export const isFirebaseConfigured = Boolean(
  env.firebase.projectId && env.firebase.clientEmail && env.firebase.privateKey,
);
