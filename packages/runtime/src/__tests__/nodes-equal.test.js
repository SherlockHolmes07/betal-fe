import { describe, it, expect } from 'vitest'
import { areNodesEqual } from '../nodes-equal.js'
import { h, hString, hFragment, DOM_TYPES } from '../h.js'

// ---------------------------------------------------------------------------
// areNodesEqual
//
// Determines whether two vnodes are "equivalent" for reconciliation purposes:
// i.e. whether the old DOM node can be patched rather than replaced.
// This is NOT a deep equality check — it only checks type, tag, and key.
// ---------------------------------------------------------------------------

describe('areNodesEqual', () => {
  describe('different types are never equal', () => {
    it('returns false when comparing a text node to an element node', () => {
      expect(areNodesEqual(hString('hello'), h('div'))).toBe(false)
    })

    it('returns false when comparing a fragment to an element', () => {
      expect(areNodesEqual(hFragment([]), h('div'))).toBe(false)
    })
  })

  describe('text and fragment nodes', () => {
    it('two text nodes are always equal (their content is patched separately)', () => {
      expect(areNodesEqual(hString('a'), hString('b'))).toBe(true)
    })

    it('two fragment nodes are always equal', () => {
      expect(areNodesEqual(hFragment([]), hFragment([h('span')]))).toBe(true)
    })
  })

  describe('element nodes — matched by tag + key', () => {
    it('same tag with no key → equal', () => {
      expect(areNodesEqual(h('div'), h('div'))).toBe(true)
    })

    it('different tags → not equal', () => {
      expect(areNodesEqual(h('div'), h('span'))).toBe(false)
    })

    it('same tag, same key → equal', () => {
      expect(areNodesEqual(h('li', { key: 'a' }), h('li', { key: 'a' }))).toBe(true)
    })

    it('same tag, different key → not equal', () => {
      expect(areNodesEqual(h('li', { key: 'a' }), h('li', { key: 'b' }))).toBe(false)
    })

    it('same tag, one has a key and the other does not → not equal', () => {
      expect(areNodesEqual(h('li', { key: 'a' }), h('li'))).toBe(false)
    })
  })

  describe('component nodes — matched by constructor reference + key', () => {
    const ComponentA = () => {}
    const ComponentB = () => {}

    it('same component constructor with no key → equal', () => {
      expect(areNodesEqual(h(ComponentA), h(ComponentA))).toBe(true)
    })

    it('different component constructors → not equal', () => {
      expect(areNodesEqual(h(ComponentA), h(ComponentB))).toBe(false)
    })

    it('same constructor, same key → equal', () => {
      expect(areNodesEqual(h(ComponentA, { key: '1' }), h(ComponentA, { key: '1' }))).toBe(true)
    })

    it('same constructor, different key → not equal', () => {
      expect(areNodesEqual(h(ComponentA, { key: '1' }), h(ComponentA, { key: '2' }))).toBe(false)
    })
  })
})
