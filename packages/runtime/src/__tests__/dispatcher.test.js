import { describe, it, expect, vi } from 'vitest'
import { Dispatcher } from '../dispatcher.js'

// Each test creates its own Dispatcher instance to avoid shared state.
const makeDispatcher = () => new Dispatcher()

// ---------------------------------------------------------------------------
// subscribe + dispatch
// ---------------------------------------------------------------------------

describe('Dispatcher', () => {
  describe('subscribe and dispatch', () => {
    it('calls the subscribed handler when the matching command is dispatched', () => {
      const dispatcher = makeDispatcher()
      const handler = vi.fn()

      dispatcher.subscribe('increment', handler)
      dispatcher.dispatch('increment', 5)

      expect(handler).toHaveBeenCalledWith(5)
    })

    it('passes the payload to the handler', () => {
      const dispatcher = makeDispatcher()
      const handler = vi.fn()
      const payload = { type: 'ADD_ITEM', item: { id: 1 } }

      dispatcher.subscribe('action', handler)
      dispatcher.dispatch('action', payload)

      expect(handler).toHaveBeenCalledWith(payload)
    })

    it('calls all handlers registered for the same command', () => {
      const dispatcher = makeDispatcher()
      const handlerA = vi.fn()
      const handlerB = vi.fn()

      dispatcher.subscribe('update', handlerA)
      dispatcher.subscribe('update', handlerB)
      dispatcher.dispatch('update', 42)

      expect(handlerA).toHaveBeenCalledWith(42)
      expect(handlerB).toHaveBeenCalledWith(42)
    })

    it('does not call handlers registered for a different command', () => {
      const dispatcher = makeDispatcher()
      const handler = vi.fn()

      dispatcher.subscribe('add', handler)
      dispatcher.dispatch('remove', {})

      expect(handler).not.toHaveBeenCalled()
    })

    it('logs a warning when dispatching to a command with no subscribers', () => {
      const dispatcher = makeDispatcher()
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

      dispatcher.dispatch('nonexistent')

      expect(warn).toHaveBeenCalled()
      warn.mockRestore()
    })
  })

  describe('unsubscribe', () => {
    it('returns an unsubscribe function that stops the handler from receiving future events', () => {
      const dispatcher = makeDispatcher()
      const handler = vi.fn()

      const unsubscribe = dispatcher.subscribe('click', handler)
      unsubscribe()
      dispatcher.dispatch('click', null)

      expect(handler).not.toHaveBeenCalled()
    })

    it('does not affect other handlers for the same command when one unsubscribes', () => {
      const dispatcher = makeDispatcher()
      const handlerA = vi.fn()
      const handlerB = vi.fn()

      const unsubscribeA = dispatcher.subscribe('event', handlerA)
      dispatcher.subscribe('event', handlerB)

      unsubscribeA()
      dispatcher.dispatch('event', null)

      expect(handlerA).not.toHaveBeenCalled()
      expect(handlerB).toHaveBeenCalledOnce()
    })

    it('silently ignores a duplicate subscription of the same handler', () => {
      const dispatcher = makeDispatcher()
      const handler = vi.fn()

      dispatcher.subscribe('action', handler)
      const unsubscribeDuplicate = dispatcher.subscribe('action', handler)

      // The duplicate returns a no-op unsubscribe; the original subscription stays
      unsubscribeDuplicate()
      dispatcher.dispatch('action', null)

      expect(handler).toHaveBeenCalledOnce()
    })
  })

  describe('afterEveryCommand', () => {
    it('calls the after-handler after every dispatch regardless of command name', () => {
      const dispatcher = makeDispatcher()
      const afterHandler = vi.fn()

      dispatcher.afterEveryCommand(afterHandler)
      dispatcher.dispatch('commandA', null)
      dispatcher.dispatch('commandB', null)

      expect(afterHandler).toHaveBeenCalledTimes(2)
    })

    it('calls the after-handler even when the dispatched command has no subscribers', () => {
      const dispatcher = makeDispatcher()
      const afterHandler = vi.fn()
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

      dispatcher.afterEveryCommand(afterHandler)
      dispatcher.dispatch('no-subscribers', null)

      expect(afterHandler).toHaveBeenCalledOnce()
      warn.mockRestore()
    })

    it('returns an unsubscribe function that removes the after-handler', () => {
      const dispatcher = makeDispatcher()
      const afterHandler = vi.fn()

      const unsubscribe = dispatcher.afterEveryCommand(afterHandler)
      unsubscribe()
      dispatcher.dispatch('anything', null)

      expect(afterHandler).not.toHaveBeenCalled()
    })
  })
})
