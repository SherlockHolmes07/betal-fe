import { describe, it, expect, vi, beforeEach } from 'vitest'
import { addEventListener, addEventListeners, removeEventListeners } from '../events.js'

let el

beforeEach(() => {
  el = document.createElement('button')
  document.body.appendChild(el)
})

// ---------------------------------------------------------------------------
// addEventListener
// ---------------------------------------------------------------------------

describe('addEventListener', () => {
  it('attaches a handler so it is called when the event fires', () => {
    const handler = vi.fn()
    addEventListener('click', handler, el)

    el.click()

    expect(handler).toHaveBeenCalledOnce()
  })

  it('passes the native event object to the handler', () => {
    let receivedEvent
    addEventListener('click', (e) => { receivedEvent = e }, el)

    el.click()

    expect(receivedEvent).toBeInstanceOf(Event)
  })

  it('returns the wrapped listener function (needed to remove the listener later)', () => {
    const handler = vi.fn()
    const wrapped = addEventListener('click', handler, el)

    expect(typeof wrapped).toBe('function')
  })

  it('binds "this" to the hostComponent when one is provided', () => {
    let capturedThis
    const hostComponent = { name: 'ParentComponent' }
    addEventListener('click', function () { capturedThis = this }, el, hostComponent)

    el.click()

    expect(capturedThis).toBe(hostComponent)
  })

  it('does not bind "this" to a component when hostComponent is null', () => {
    // Without a host component the handler is called with spread arguments
    // (no explicit this binding), which in strict mode is undefined.
    let capturedThis
    addEventListener('click', function () { capturedThis = this }, el, null)

    el.click()

    // In strict mode this will be undefined; we just verify it is NOT a component
    expect(capturedThis).not.toEqual({ name: 'ParentComponent' })
  })
})

// ---------------------------------------------------------------------------
// addEventListeners
// ---------------------------------------------------------------------------

describe('addEventListeners', () => {
  it('attaches every event in the events map', () => {
    const clickHandler = vi.fn()
    const focusHandler = vi.fn()

    addEventListeners({ click: clickHandler, focus: focusHandler }, el)

    el.click()
    el.dispatchEvent(new Event('focus'))

    expect(clickHandler).toHaveBeenCalledOnce()
    expect(focusHandler).toHaveBeenCalledOnce()
  })

  it('returns a listeners map with the same event names as keys', () => {
    const handler = vi.fn()
    const listeners = addEventListeners({ click: handler }, el)

    expect(listeners).toHaveProperty('click')
    expect(typeof listeners.click).toBe('function')
  })

  it('returns an empty object when the events map is empty', () => {
    const listeners = addEventListeners({}, el)
    expect(listeners).toEqual({})
  })

  it('defaults to an empty events map when called with no arguments', () => {
    // Should not throw
    expect(() => addEventListeners(undefined, el)).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// removeEventListeners
// ---------------------------------------------------------------------------

describe('removeEventListeners', () => {
  it('detaches listeners so they are no longer called after removal', () => {
    const handler = vi.fn()
    const listeners = addEventListeners({ click: handler }, el)

    removeEventListeners(listeners, el)
    el.click()

    expect(handler).not.toHaveBeenCalled()
  })

  it('handles an empty listeners map without throwing', () => {
    expect(() => removeEventListeners({}, el)).not.toThrow()
  })

  it('handles undefined listeners without throwing', () => {
    expect(() => removeEventListeners(undefined, el)).not.toThrow()
  })
})
