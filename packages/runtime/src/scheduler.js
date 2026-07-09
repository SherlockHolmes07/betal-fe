let isScheduled = false;
const jobs = [];

/**
 * Queue a job to run on the next microtask tick.
 *
 * @param {Function} job - Function to run. May return a value or a promise.
 * @returns {void}
 */
export function enqueueJob(job) {
  jobs.push(job);
  scheduleUpdate();
}

function scheduleUpdate() {
  if (isScheduled) return;

  isScheduled = true;
  // Schedule a microtask to process the job queue. Using `queueMicrotask` ensures that the jobs are executed after the current synchronous code completes, but before the next macrotask (like setTimeout) runs.
  queueMicrotask(processJobs);
}

/**
 * Run every queued job in order, draining the queue. If a job returns a
 * promise, its rejection is caught and logged; if a job throws
 * synchronously, that's caught and logged too — either way, one bad job
 * must not stop the rest of the queue from running, and must not leave
 * `isScheduled` stuck at `true` (which would silently stop the scheduler
 * from ever running anything again).
 */
function processJobs() {
  while (jobs.length > 0) {
    const job = jobs.shift();
    try {
      const result = job();
      Promise.resolve(result).then(
        () => {
          // Job completed successfully
        },
        (error) => {
          console.error(`[scheduler]: ${error}`);
        }
      );
    } catch (error) {
      console.error(`[scheduler]: ${error}`);
    }
  }

  isScheduled = false;
}

/**
 * Flush the job queue and return a promise that resolves once pending jobs
 * have had a chance to settle. Useful in tests to wait for scheduled work.
 *
 * @returns {Promise<void>}
 */
export function nextTick() {
  scheduleUpdate();
  return flushPromises();
}

function flushPromises() {
  // setTimeout executes after the current call stack and any microtasks have completed, ensuring that all queued jobs have run.
  return new Promise((resolve) => setTimeout(resolve));
}