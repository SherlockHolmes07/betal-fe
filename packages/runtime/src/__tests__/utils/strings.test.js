import { describe, it, expect } from 'vitest'
import { isNotEmptyString, isNotBlankOrEmptyString } from '../../utils/strings.js'

// ---------------------------------------------------------------------------
// isNotEmptyString
// ---------------------------------------------------------------------------

describe('isNotEmptyString', () => {
  it('returns false for the empty string', () => {
    expect(isNotEmptyString('')).toBe(false)
  })

  it('returns true for a non-empty string', () => {
    expect(isNotEmptyString('hello')).toBe(true)
  })

  it('returns true for a whitespace-only string (it is not empty)', () => {
    // isNotEmptyString only checks length — whitespace is a valid non-empty string.
    // isNotBlankOrEmptyString is used when whitespace should also be excluded.
    expect(isNotEmptyString('   ')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// isNotBlankOrEmptyString
// ---------------------------------------------------------------------------

describe('isNotBlankOrEmptyString', () => {
  it('returns false for the empty string', () => {
    expect(isNotBlankOrEmptyString('')).toBe(false)
  })

  it('returns false for a string of only spaces', () => {
    expect(isNotBlankOrEmptyString('   ')).toBe(false)
  })

  it('returns false for a string of only tabs and newlines', () => {
    expect(isNotBlankOrEmptyString('\t\n')).toBe(false)
  })

  it('returns true for a string with real content', () => {
    expect(isNotBlankOrEmptyString('active')).toBe(true)
  })

  it('returns true for a string with leading/trailing whitespace around content', () => {
    // The trim() only matters for the emptiness check; "  text  ".trim() !== ''
    expect(isNotBlankOrEmptyString('  active  ')).toBe(true)
  })
})
