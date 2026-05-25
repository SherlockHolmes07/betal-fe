import { describe, it, expect } from 'vitest'
import {
  withoutNulls,
  arraysDiff,
  arraysDiffSequence,
  ARRAY_DIFF_OP,
} from '../../utils/arrays.js'

// ---------------------------------------------------------------------------
// withoutNulls
// ---------------------------------------------------------------------------

describe('withoutNulls', () => {
  it('removes null entries', () => {
    expect(withoutNulls([1, null, 2])).toEqual([1, 2])
  })

  it('removes undefined entries', () => {
    expect(withoutNulls([1, undefined, 2])).toEqual([1, 2])
  })

  it('keeps falsy values that are not null/undefined (0, false, empty string)', () => {
    expect(withoutNulls([0, false, '', null])).toEqual([0, false, ''])
  })

  it('returns an identical array when there is nothing to remove', () => {
    expect(withoutNulls([1, 2, 3])).toEqual([1, 2, 3])
  })

  it('returns an empty array when every element is null or undefined', () => {
    expect(withoutNulls([null, undefined, null])).toEqual([])
  })

  it('returns an empty array unchanged', () => {
    expect(withoutNulls([])).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// arraysDiff
// ---------------------------------------------------------------------------

describe('arraysDiff', () => {
  it('reports items that appear in the new array but not the old one as added', () => {
    const { added } = arraysDiff(['a', 'b'], ['a', 'b', 'c'])
    expect(added).toEqual(['c'])
  })

  it('reports items that appear in the old array but not the new one as removed', () => {
    const { removed } = arraysDiff(['a', 'b', 'c'], ['a', 'b'])
    expect(removed).toEqual(['c'])
  })

  it('returns empty added and removed when both arrays are identical', () => {
    const { added, removed } = arraysDiff(['a', 'b'], ['a', 'b'])
    expect(added).toEqual([])
    expect(removed).toEqual([])
  })

  it('reports the full old array as removed when new array is empty', () => {
    const { removed } = arraysDiff(['a', 'b'], [])
    expect(removed).toEqual(['a', 'b'])
  })

  it('reports the full new array as added when old array is empty', () => {
    const { added } = arraysDiff([], ['a', 'b'])
    expect(added).toEqual(['a', 'b'])
  })

  it('handles a completely replaced array (all removed, all added)', () => {
    const { added, removed } = arraysDiff(['a'], ['b'])
    expect(added).toEqual(['b'])
    expect(removed).toEqual(['a'])
  })
})

// ---------------------------------------------------------------------------
// arraysDiffSequence
// ---------------------------------------------------------------------------

describe('arraysDiffSequence', () => {
  describe('NOOP — items that stay in place', () => {
    it('produces a NOOP for every item when both arrays are identical', () => {
      const ops = arraysDiffSequence(['a', 'b', 'c'], ['a', 'b', 'c'])

      expect(ops).toHaveLength(3)
      expect(ops.every((op) => op.op === ARRAY_DIFF_OP.NOOP)).toBe(true)
    })

    it('records the original index so the caller can find the old vnode', () => {
      const ops = arraysDiffSequence(['a', 'b'], ['a', 'b'])

      expect(ops[0]).toMatchObject({ op: ARRAY_DIFF_OP.NOOP, originalIndex: 0, index: 0 })
      expect(ops[1]).toMatchObject({ op: ARRAY_DIFF_OP.NOOP, originalIndex: 1, index: 1 })
    })
  })

  describe('ADD — items that appear for the first time', () => {
    it('produces a single ADD when a new item is appended', () => {
      const ops = arraysDiffSequence([], ['a'])

      expect(ops).toHaveLength(1)
      expect(ops[0]).toMatchObject({ op: ARRAY_DIFF_OP.ADD, index: 0, item: 'a' })
    })

    it('produces an ADD at the correct index when inserting at the front', () => {
      const ops = arraysDiffSequence(['b'], ['a', 'b'])
      const add = ops.find((op) => op.op === ARRAY_DIFF_OP.ADD)

      expect(add).toMatchObject({ op: ARRAY_DIFF_OP.ADD, index: 0, item: 'a' })
    })

    it('produces multiple ADDs when several items are new', () => {
      const ops = arraysDiffSequence([], ['a', 'b', 'c'])

      expect(ops.filter((op) => op.op === ARRAY_DIFF_OP.ADD)).toHaveLength(3)
    })
  })

  describe('REMOVE — items that no longer exist', () => {
    it('produces a single REMOVE when an item is deleted', () => {
      const ops = arraysDiffSequence(['a'], [])

      expect(ops).toHaveLength(1)
      expect(ops[0]).toMatchObject({ op: ARRAY_DIFF_OP.REMOVE, index: 0, item: 'a' })
    })

    it('removes leftover items that have no match in the new array', () => {
      const ops = arraysDiffSequence(['a', 'b', 'c'], ['a'])
      const removes = ops.filter((op) => op.op === ARRAY_DIFF_OP.REMOVE)

      expect(removes).toHaveLength(2)
    })
  })

  describe('MOVE — items that shift position', () => {
    it('produces a MOVE when two items swap positions', () => {
      const ops = arraysDiffSequence(['a', 'b'], ['b', 'a'])
      const move = ops.find((op) => op.op === ARRAY_DIFF_OP.MOVE)

      expect(move).toBeDefined()
    })

    it('records both the original index (where it came from) and the new index', () => {
      const ops = arraysDiffSequence(['a', 'b', 'c'], ['c', 'a', 'b'])
      const move = ops.find((op) => op.op === ARRAY_DIFF_OP.MOVE)

      expect(move.originalIndex).toBeGreaterThanOrEqual(0)
      expect(move.index).toBeGreaterThanOrEqual(0)
    })
  })

  describe('mixed operations', () => {
    it('handles a remove-and-add in the same sequence', () => {
      const ops = arraysDiffSequence(['a', 'b'], ['b', 'c'])
      const types = ops.map((op) => op.op)

      expect(types).toContain(ARRAY_DIFF_OP.REMOVE)
      expect(types).toContain(ARRAY_DIFF_OP.ADD)
    })

    it('handles insert + remove + move together', () => {
      // old: [a, b, c]  new: [c, b, d]  → remove a, move c to front, noop b, add d
      const ops = arraysDiffSequence(['a', 'b', 'c'], ['c', 'b', 'd'])
      const types = ops.map((op) => op.op)

      expect(types).toContain(ARRAY_DIFF_OP.REMOVE)
      expect(types).toContain(ARRAY_DIFF_OP.ADD)
    })
  })

  describe('custom equality function', () => {
    it('uses the provided equals function to match items by identity', () => {
      const byId = (a, b) => a.id === b.id
      const ops = arraysDiffSequence([{ id: 1 }], [{ id: 1 }], byId)

      expect(ops.every((op) => op.op === ARRAY_DIFF_OP.NOOP)).toBe(true)
    })

    it('treats objects with different ids as distinct even if structurally similar', () => {
      const byId = (a, b) => a.id === b.id
      const ops = arraysDiffSequence([{ id: 1 }], [{ id: 2 }], byId)
      const types = ops.map((op) => op.op)

      expect(types).toContain(ARRAY_DIFF_OP.REMOVE)
      expect(types).toContain(ARRAY_DIFF_OP.ADD)
    })
  })
})
