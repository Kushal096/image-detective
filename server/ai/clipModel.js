import { env } from "../config/env.js";
import { createLogger } from "../utils/logger.js";
import { preprocessForClip } from "./imageProcessor.js";
import { clipProcessClient } from "./ClipProcessClient.js";

const log = createLogger("clip");

/**
 * Main-thread CLIP facade. Real ONNX inference runs in an isolated child process
 * so native runtime crashes cannot kill the game server.
 */
class ClipModel {
  #dim = 512;

  warmup() {
    if (env.ai.mock) return Promise.resolve();
    return clipProcessClient.warmup();
  }

  /**
   * @param {Buffer} buffer
   * @returns {Promise<Float32Array>}
   */
  async embed(buffer) {
    if (env.ai.mock) return this.#mockEmbed(buffer);
    try {
      const preprocessed = await preprocessForClip(buffer);
      return await clipProcessClient.embed(preprocessed);
    } catch (err) {
      if (!env.ai.fallbackMock) throw err;
      log.warn("CLIP unavailable, using mock embedding", err.message);
      return this.#mockEmbed(buffer);
    }
  }

  async #mockEmbed(buffer) {
    const { data, info } = await preprocessForClip(buffer);
    const vec = new Float32Array(this.#dim);
    const { width, height, channels } = info;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const px = (y * width + x) * channels;
        const bucket = ((y >> 4) * 14 + (x >> 4)) % this.#dim;
        for (let c = 0; c < channels; c += 1) {
          vec[bucket] += data[px + c];
        }
      }
    }
    return l2normalize(vec);
  }
}

const l2normalize = (vec) => {
  let norm = 0;
  for (let i = 0; i < vec.length; i += 1) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < vec.length; i += 1) vec[i] /= norm;
  return vec;
};

export const clipModel = new ClipModel();
