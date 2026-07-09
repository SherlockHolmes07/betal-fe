import { describe, it, expect } from 'vitest'
import { h, hFragment, DOM_TYPES } from '../h.js'
import { extractChildNodes } from '../vdom-utils.js'

// ---------------------------------------------------------------------------
// extractChildNodes — flattens fragment children
// ---------------------------------------------------------------------------

describe('extractChildNodes', () => {
  it('returns an empty array for a vnode with no children', () => {
    const vnode = h('div')
    expect(extractChildNodes(vnode)).toEqual([])
  })

  it('returns direct children as-is when none are fragments', () => {
    const span = h('span')
    const em = h('em')
    const parent = h('div', {}, [span, em])

    expect(extractChildNodes(parent)).toEqual([span, em])
  })

  it('unwraps immediate fragment children into the flat list', () => {
    const a = h('a')
    const b = h('b')
    const fragment = hFragment([a, b])
    const parent = h('div', {}, [fragment])

    const children = extractChildNodes(parent)

    expect(children).toEqual([a, b])
  })

  it('recursively unwraps nested fragments', () => {
    const leaf = h('span')
    const inner = hFragment([leaf])
    const outer = hFragment([inner])
    const parent = h('div', {}, [outer])

    expect(extractChildNodes(parent)).toEqual([leaf])
  })

  it('handles a mix of plain nodes and fragments', () => {
    const a = h('a')
    const b = h('b')
    const c = h('c')
    const frag = hFragment([b, c])
    const parent = h('div', {}, [a, frag])

    expect(extractChildNodes(parent)).toEqual([a, b, c])
  })

  it('returns an empty array for a vnode whose children is null', () => {
    const vnode = { type: DOM_TYPES.FRAGMENT, children: null }
    expect(extractChildNodes(vnode)).toEqual([])
  })
})
