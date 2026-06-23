/**
 * Isolated child process for CLIP / ONNX inference. A native runtime crash here
 * must not take down the main game server.
 */
import { env } from "../config/env.js";
import { preprocessForClip } from "./imageProcessor.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("clip:proc");

let processor = null;
let model = null;
let RawImage = null;
let ready = null;

const l2normalize = (vec) => {
  let norm = 0;
  for (let i = 0; i < vec.length; i += 1) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < vec.length; i += 1) vec[i] /= norm;
  return vec;
};

const load = async () => {
  if (ready) return ready;

  ready = (async () => {
    log.info("loading CLIP model", { model: env.ai.model });
    const {
      AutoProcessor,
      CLIPVisionModelWithProjection,
      RawImage: RI,
      env: tfEnv,
    } = await import("@xenova/transformers");

    tfEnv.allowLocalModels = true;
    tfEnv.useBrowserCache = false;

    RawImage = RI;
    processor = await AutoProcessor.from_pretrained(env.ai.model);
    model = await CLIPVisionModelWithProjection.from_pretrained(env.ai.model);
    log.info("CLIP model ready");
  })();

  return ready;
};

const embed = async (buffer) => {
  await load();
  const bytes = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  const { data, info } = await preprocessForClip(bytes);
  const image = new RawImage(
    new Uint8ClampedArray(data),
    info.width,
    info.height,
    info.channels,
  );
  const inputs = await processor(image);
  const { image_embeds: imageEmbeds } = await model(inputs);
  return Array.from(l2normalize(Float32Array.from(imageEmbeds.data)));
};

let chain = Promise.resolve();

const enqueue = (task) => {
  chain = chain.then(task).catch((err) => {
    log.error("job failed", err.message);
  });
};

process.on("message", (msg) => {
  if (msg?.type === "warmup") {
    enqueue(async () => {
      try {
        await load();
        process.send?.({ type: "warmup", id: msg.id, ok: true });
      } catch (err) {
        process.send?.({
          type: "warmup",
          id: msg.id,
          ok: false,
          error: err.message,
        });
      }
    });
    return;
  }

  if (msg?.type === "embed") {
    enqueue(async () => {
      try {
        const embedding = await embed(msg.buffer);
        process.send?.({ type: "embed", id: msg.id, ok: true, embedding });
      } catch (err) {
        process.send?.({
          type: "embed",
          id: msg.id,
          ok: false,
          error: err.message,
        });
      }
    });
    return;
  }

  if (msg?.type === "shutdown") {
    process.exit(0);
  }
});

process.send?.({ type: "spawned" });
