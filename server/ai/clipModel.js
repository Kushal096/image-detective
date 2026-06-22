import { env } from '../config/env.js';
import { createLogger } from '../utils/logger.js';
import { preprocessForClip } from './imageProcessor.js';

const log = createLogger('clip');

/**
 * Lazily-loaded singleton wrapper around the CLIP vision encoder (Transformers.js
 * on the ONNX runtime). Produces L2-normalized image embeddings.
 *
 * Loading is deferred until the first embedding request so server startup is
 * never blocked by a model download. When env.ai.mock is enabled, a
 * deterministic pseudo-embedding is produced instead (useful offline / in CI).
 */
class ClipModel {
  #ready = null;
  #processor = null;
  #model = null;
  #RawImage = null;
  #dim = 512;

  /** Kicks off (and memoizes) model loading. Safe to call repeatedly. */
  async load() {
    if (env.ai.mock) return;
    if (this.#ready) return this.#ready;

    this.#ready = (async () => {
      log.info('loading CLIP model', { model: env.ai.model });
      const { AutoProcessor, CLIPVisionModelWithProjection, RawImage, env: tfEnv } =
        await import('@xenova/transformers');

      // Allow remote model download; cache locally between runs.
      tfEnv.allowLocalModels = true;
      tfEnv.useBrowserCache = false;

      this.#RawImage = RawImage;
      this.#processor = await AutoProcessor.from_pretrained(env.ai.model);
      this.#model = await CLIPVisionModelWithProjection.from_pretrained(env.ai.model);
      log.info('CLIP model ready');
    })();

    return this.#ready;
  }

  /**
   * Produces an L2-normalized embedding (Float32Array) for an image buffer.
   * @param {Buffer} buffer
   * @returns {Promise<Float32Array>}
   */
  async embed(buffer) {
    if (env.ai.mock) return this.#mockEmbed(buffer);

    await this.load();
    const { data, info } = await preprocessForClip(buffer);
    const image = new this.#RawImage(
      new Uint8ClampedArray(data),
      info.width,
      info.height,
      info.channels,
    );

    const inputs = await this.#processor(image);
    const { image_embeds: imageEmbeds } = await this.#model(inputs);
    return l2normalize(Float32Array.from(imageEmbeds.data));
  }

  /**
   * Deterministic, content-derived pseudo-embedding for offline development.
   * Identical images yield identical vectors; similar byte distributions yield
   * similar vectors, so the scoring pipeline remains exercisable end-to-end.
   */
  async #mockEmbed(buffer) {
    const { data } = await preprocessForClip(buffer);
    const vec = new Float32Array(this.#dim);
    for (let i = 0; i < data.length; i += 1) {
      vec[i % this.#dim] += data[i];
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
