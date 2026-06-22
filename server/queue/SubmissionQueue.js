/**
 * A minimal FIFO async job queue with bounded concurrency. The Express request
 * handler enqueues a job and returns immediately; the worker pool drains the
 * queue without ever blocking the event loop for synchronous CPU work
 * (inference is async via the ONNX runtime).
 */
export class SubmissionQueue {
  #jobs = [];
  #waiters = [];
  #closed = false;

  /** Number of jobs currently waiting to be picked up. */
  get size() {
    return this.#jobs.length;
  }

  /** Adds a job to the tail of the queue, waking a waiting worker if present. */
  enqueue(job) {
    if (this.#closed) throw new Error('SubmissionQueue is closed');
    const waiter = this.#waiters.shift();
    if (waiter) {
      waiter(job);
    } else {
      this.#jobs.push(job);
    }
  }

  /**
   * Resolves with the next job, awaiting one if the queue is empty.
   * Returns null when the queue is closed and drained.
   * @returns {Promise<object|null>}
   */
  dequeue() {
    if (this.#jobs.length > 0) {
      return Promise.resolve(this.#jobs.shift());
    }
    if (this.#closed) return Promise.resolve(null);
    return new Promise((resolve) => this.#waiters.push(resolve));
  }

  /** Stops accepting jobs and releases any blocked workers. */
  close() {
    this.#closed = true;
    this.#waiters.forEach((resolve) => resolve(null));
    this.#waiters = [];
  }
}
