import { createLogger } from '../utils/logger.js';

const log = createLogger('workers');

/**
 * Drives a fixed number of concurrent async workers that pull jobs off a
 * SubmissionQueue and hand them to a processor function. Keeps AI inference off
 * the critical request path and bounds parallelism to protect memory/CPU.
 */
export class WorkerPool {
  /**
   * @param {object} opts
   * @param {import('../queue/SubmissionQueue.js').SubmissionQueue} opts.queue
   * @param {(job: object) => Promise<void>} opts.processor
   * @param {number} opts.concurrency
   */
  constructor({ queue, processor, concurrency = 2 }) {
    this.queue = queue;
    this.processor = processor;
    this.concurrency = Math.max(1, concurrency);
    this.running = false;
    this.workers = [];
  }

  start() {
    if (this.running) return;
    this.running = true;
    for (let i = 0; i < this.concurrency; i += 1) {
      this.workers.push(this.#runWorker(i));
    }
    log.info('worker pool started', { concurrency: this.concurrency });
  }

  async #runWorker(id) {
    while (this.running) {
      const job = await this.queue.dequeue();
      if (job === null) break; // queue closed
      try {
        await this.processor(job);
      } catch (err) {
        log.error('job processing failed', { worker: id, error: err.message });
        if (typeof job.onError === 'function') {
          try {
            job.onError(err);
          } catch (cbErr) {
            log.error('job error callback threw', cbErr.message);
          }
        }
      }
    }
  }

  async stop() {
    this.running = false;
    this.queue.close();
    await Promise.allSettled(this.workers);
    this.workers = [];
    log.info('worker pool stopped');
  }
}
