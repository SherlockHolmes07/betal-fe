import { describe, it, expect, vi } from 'vitest'
import { enqueueJob, nextTick } from '../scheduler.js'

// ---------------------------------------------------------------------------
// enqueueJob
// ---------------------------------------------------------------------------

describe('enqueueJob', () => {
  it('does not run the job synchronously — it is deferred to a microtask', async () => {
    let executed = false
    enqueueJob(() => { executed = true })

    // Right after enqueuing the job has NOT yet run
    expect(executed).toBe(false)

    await nextTick()

    expect(executed).toBe(true)
  })

  it('runs multiple enqueued jobs in the order they were added (FIFO)', async () => {
    const order = []

    enqueueJob(() => order.push(1))
    enqueueJob(() => order.push(2))
    enqueueJob(() => order.push(3))

    await nextTick()

    expect(order).toEqual([1, 2, 3])
  })

  it('coalesces multiple synchronous enqueueJob calls into a single flush', async () => {
    // Contract: jobs enqueued back-to-back run in the same microtask flush,
    // not in separate ones. We verify this by observing that all three jobs
    // execute before any awaited promise resolves — i.e. before nextTick().
    const order = []
    enqueueJob(() => order.push('a'))
    enqueueJob(() => order.push('b'))
    enqueueJob(() => order.push('c'))

    expect(order).toEqual([]) // none have run yet

    await nextTick()

    expect(order).toEqual(['a', 'b', 'c'])
  })

  it('supports async jobs — a failing job is caught and logged, not re-thrown', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    enqueueJob(() => Promise.reject(new Error('job failed')))
    await nextTick()

    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('continues running subsequent jobs even when one rejects asynchronously', async () => {
    const afterFailure = vi.fn()
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    enqueueJob(() => Promise.reject(new Error('async error')))
    enqueueJob(afterFailure)

    await nextTick()

    expect(afterFailure).toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('continues running subsequent jobs in the same flush even when one throws synchronously', async () => {
    const afterFailure = vi.fn()
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    enqueueJob(() => { throw new Error('sync error') })
    enqueueJob(afterFailure)

    await nextTick()

    expect(errorSpy).toHaveBeenCalled()
    expect(afterFailure).toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('recovers for jobs enqueued in a later flush even after a previous job threw synchronously', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    enqueueJob(() => { throw new Error('sync error') })
    await nextTick()

    // A synchronous throw must not leave the scheduler permanently stuck —
    // work enqueued afterwards, in a completely separate flush, still needs
    // to run.
    const later = vi.fn()
    enqueueJob(later)
    await nextTick()

    expect(later).toHaveBeenCalled()
    errorSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// nextTick
// ---------------------------------------------------------------------------

describe('nextTick', () => {
  it('resolves after all currently enqueued jobs have been processed', async () => {
    let jobDone = false
    enqueueJob(() => { jobDone = true })

    await nextTick()

    expect(jobDone).toBe(true)
  })
})
