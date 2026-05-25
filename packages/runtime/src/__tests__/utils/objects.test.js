import { describe, it, expect } from 'vitest'
import { objectsDiff, hasOwnProperty } from '../../utils/objects.js'

// ---------------------------------------------------------------------------
// objectsDiff
// ---------------------------------------------------------------------------

describe('objectsDiff', () => {
  it('reports keys present in new but absent from old as added', () => {
    const { added } = objectsDiff({ a: 1 }, { a: 1, b: 2 })
    expect(added).toEqual(['b'])
  })

  it('reports keys present in old but absent from new as removed', () => {
    const { removed } = objectsDiff({ a: 1, b: 2 }, { a: 1 })
    expect(removed).toEqual(['b'])
  })

  it('reports keys that exist in both objects but with different values as updated', () => {
    const { updated } = objectsDiff({ a: 1 }, { a: 2 })
    expect(updated).toEqual(['a'])
  })

  it('returns empty arrays when both objects are identical', () => {
    const { added, removed, updated } = objectsDiff({ a: 1, b: 2 }, { a: 1, b: 2 })
    expect(added).toEqual([])
    expect(removed).toEqual([])
    expect(updated).toEqual([])
  })

  it('reports all keys of the new object as added when old object is empty', () => {
    const { added } = objectsDiff({}, { a: 1, b: 2 })
    expect(added).toContain('a')
    expect(added).toContain('b')
  })

  it('reports all keys of the old object as removed when new object is empty', () => {
    const { removed } = objectsDiff({ a: 1, b: 2 }, {})
    expect(removed).toContain('a')
    expect(removed).toContain('b')
  })

  it('uses strict equality — a value changing from 1 to "1" counts as updated', () => {
    const { updated } = objectsDiff({ x: 1 }, { x: '1' })
    expect(updated).toEqual(['x'])
  })

  it('does not report a key as updated when its value is unchanged', () => {
    const { updated } = objectsDiff({ a: 1, b: 2 }, { a: 1, b: 99 })
    expect(updated).not.toContain('a')
    expect(updated).toContain('b')
  })
})

// ---------------------------------------------------------------------------
// hasOwnProperty
// ---------------------------------------------------------------------------

describe('hasOwnProperty', () => {
  it('returns true for own properties', () => {
    expect(hasOwnProperty({ key: 'value' }, 'key')).toBe(true)
  })

  it('returns false for properties on the prototype chain', () => {
    // 'toString' is on Object.prototype, not a direct own property
    expect(hasOwnProperty({}, 'toString')).toBe(false)
  })

  it('returns false for missing properties', () => {
    expect(hasOwnProperty({ a: 1 }, 'b')).toBe(false)
  })

  it('works correctly on null-prototype objects that have no hasOwnProperty method', () => {
    const bare = Object.create(null)
    bare.x = 42
    expect(hasOwnProperty(bare, 'x')).toBe(true)
    expect(hasOwnProperty(bare, 'y')).toBe(false)
  })
})
