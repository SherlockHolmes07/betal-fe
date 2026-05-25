import { describe, it, expect } from 'vitest'
import { assert } from '../../utils/assert.js'

describe('assert', () => {
  it('does nothing when the condition is truthy', () => {
    expect(() => assert(true)).not.toThrow()
    expect(() => assert(1)).not.toThrow()
    expect(() => assert('non-empty')).not.toThrow()
  })

  it('throws an Error when the condition is falsy', () => {
    expect(() => assert(false)).toThrow(Error)
  })

  it('uses the default message "Assertion failed" when no message is provided', () => {
    expect(() => assert(false)).toThrow('Assertion failed')
  })

  it('throws with the custom message when one is provided', () => {
    expect(() => assert(false, 'Routes must be an array')).toThrow('Routes must be an array')
  })

  it('throws when the condition is null, undefined, 0, or empty string', () => {
    expect(() => assert(null)).toThrow()
    expect(() => assert(undefined)).toThrow()
    expect(() => assert(0)).toThrow()
    expect(() => assert('')).toThrow()
  })
})
