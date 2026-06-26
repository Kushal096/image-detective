import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createLogger } from "../utils/logger.js";

const log = createLogger("clip:client");

const SCRIPT = fileURLToPath(
  new URL("./clipInferenceProcess.js", import.meta.url),
);
const REQUEST_TIMEOUT_MS = 120_000;

export class ClipInferenceError extends Error {
  constructor(message) {
    super(message);
    this.name = "ClipInferenceError";
    this.code = "CLIP_UNAVAILABLE";
    this.status = 503;
  }
}

/**
 * Talks to clipInferenceProcess.js over IPC. Restarts the child automatically
 * after crashes so ONNX failures surface as request errors, not server death.
 */
export class ClipProcessClient {
  #child = null;
  #nextId = 1;
  #pending = new Map();
  #boot = null;

  warmup() {
    return this.#request("warmup");
  }

  /** @param {{ data: Buffer, info: { width: number, height: number, channels: number } }} preprocessed */
  embed(preprocessed) {
    return this.#request("embed", preprocessed);
  }

  async stop() {
    const child = this.#child;
    this.#child = null;
    this.#rejectAll(new ClipInferenceError("CLIP worker stopped"));
    if (!child) return;

    try {
      child.send({ type: "shutdown" });
    } catch {
      // already dead
    }

    await new Promise((resolve) => {
      const timer = setTimeout(() => {
        child.kill("SIGKILL");
        resolve();
      }, 2000);
      child.once("exit", () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  #request(type, payload = {}) {
    return new Promise((resolve, reject) => {
      this.#ensureChild()
        .then(() => {
          const id = this.#nextId++;
          const timer = setTimeout(() => {
            this.#pending.delete(id);
            reject(new ClipInferenceError("CLIP inference timed out"));
          }, REQUEST_TIMEOUT_MS);

          this.#pending.set(id, { resolve, reject, timer, type });

          try {
            this.#child.send({ type, id, ...payload });
          } catch (err) {
            clearTimeout(timer);
            this.#pending.delete(id);
            reject(new ClipInferenceError(err.message));
          }
        })
        .catch(reject);
    });
  }

  #ensureChild() {
    if (this.#child && !this.#child.killed) return Promise.resolve();
    if (this.#boot) return this.#boot;

    this.#boot = new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [SCRIPT], {
        env: {
          ...process.env,
          ORT_NUM_THREADS: "1",
        },
        stdio: ["ignore", "pipe", "pipe", "ipc"],
      });

      const failBoot = (err) => {
        if (!this.#boot) return;
        this.#boot = null;
        reject(err);
      };

      const onSpawned = (msg) => {
        if (msg?.type !== "spawned") return;
        child.off("message", onSpawned);
        this.#child = child;
        this.#boot = null;
        log.info("CLIP worker started", { pid: child.pid });
        resolve();
      };

      child.on("message", (msg) => {
        if (msg?.type === "spawned") return;
        this.#onMessage(msg);
      });

      child.on("message", onSpawned);

      child.stdout?.on("data", (chunk) => {
        const text = chunk.toString().trim();
        if (text) log.debug("worker stdout", { text });
      });

      child.stderr?.on("data", (chunk) => {
        const text = chunk.toString().trim();
        if (text) log.warn("worker stderr", { text });
      });

      child.on("exit", (code, signal) => {
        log.warn("CLIP worker exited", { code, signal });
        if (this.#child === child) this.#child = null;
        if (this.#boot) {
          failBoot(
            new ClipInferenceError(
              "CLIP worker failed to start — retry shortly",
            ),
          );
        }
        this.#rejectAll(
          new ClipInferenceError("CLIP worker crashed — retry in a moment"),
        );
      });

      child.on("error", (err) => {
        log.error("CLIP worker error", err.message);
        failBoot(new ClipInferenceError(err.message));
      });
    });

    return this.#boot;
  }

  #onMessage(msg) {
    if (!msg?.id) return;
    const pending = this.#pending.get(msg.id);
    if (!pending) return;

    clearTimeout(pending.timer);
    this.#pending.delete(msg.id);

    if (!msg.ok) {
      pending.reject(
        new ClipInferenceError(msg.error ?? "CLIP inference failed"),
      );
      return;
    }

    if (pending.type === "embed") {
      pending.resolve(new Float32Array(msg.embedding));
      return;
    }

    pending.resolve();
  }

  #rejectAll(err) {
    for (const [id, pending] of this.#pending) {
      clearTimeout(pending.timer);
      pending.reject(err);
      this.#pending.delete(id);
    }
  }
}

export const clipProcessClient = new ClipProcessClient();
