import { describe, it, expect, beforeEach } from 'vitest'
import {
  h,
  hString,
  hFragment,
  hSlot,
  didCreateSlot,
  resetDidCreateSlot,
  DOM_TYPES,
} from '../h.js'

// ---------------------------------------------------------------------------
// DOM_TYPES
// ---------------------------------------------------------------------------

describe('DOM_TYPES', () => {
  it('defines the five node type constants used throughout the framework', () => {
    expect(DOM_TYPES.TEXT).toBe('text')
    expect(DOM_TYPES.ELEMENT).toBe('element')
    expect(DOM_TYPES.FRAGMENT).toBe('fragment')
    expect(DOM_TYPES.COMPONENT).toBe('component')
    expect(DOM_TYPES.SLOT).toBe('slot')
  })
})

// ---------------------------------------------------------------------------
// h — virtual element and component creation
// ---------------------------------------------------------------------------

describe('h', () => {
  it('creates an element vnode when the tag is a string', () => {
    const vnode = h('div')

    expect(vnode.type).toBe(DOM_TYPES.ELEMENT)
    expect(vnode.tag).toBe('div')
  })

  it('creates a component vnode when the tag is a function (component constructor)', () => {
    const MyComponent = () => {}
    const vnode = h(MyComponent)

    expect(vnode.type).toBe(DOM_TYPES.COMPONENT)
    expect(vnode.tag).toBe(MyComponent)
  })

  it('stores the props on the vnode', () => {
    const vnode = h('input', { type: 'text', value: 'hello' })

    expect(vnode.props).toEqual({ type: 'text', value: 'hello' })
  })

  it('defaults props to an empty object when not provided', () => {
    const vnode = h('div')

    expect(vnode.props).toEqual({})
  })

  it('converts plain string children into text vnodes', () => {
    const vnode = h('p', {}, ['Hello'])

    expect(vnode.children[0]).toEqual({ type: DOM_TYPES.TEXT, value: 'Hello' })
  })

  it('keeps vnode children as-is (does not double-wrap them)', () => {
    const child = h('span', {}, ['world'])
    const vnode = h('div', {}, [child])

    expect(vnode.children[0]).toBe(child)
  })

  it('filters out null children', () => {
    const vnode = h('div', {}, [null, h('span'), null])

    expect(vnode.children).toHaveLength(1)
    expect(vnode.children[0].tag).toBe('span')
  })

  it('filters out undefined children', () => {
    const vnode = h('div', {}, [undefined, 'text'])

    expect(vnode.children).toHaveLength(1)
  })

  it('defaults children to an empty array when not provided', () => {
    const vnode = h('div')

    expect(vnode.children).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// hString — text vnode
// ---------------------------------------------------------------------------

describe('hString', () => {
  it('creates a text vnode with the correct type and value', () => {
    const vnode = hString('hello world')

    expect(vnode).toEqual({ type: DOM_TYPES.TEXT, value: 'hello world' })
  })

  it('preserves an empty string as a valid value', () => {
    const vnode = hString('')

    expect(vnode.value).toBe('')
  })
})

// ---------------------------------------------------------------------------
// hFragment — grouping wrapper with no real DOM node
// ---------------------------------------------------------------------------

describe('hFragment', () => {
  it('creates a fragment vnode', () => {
    const vnode = hFragment([])

    expect(vnode.type).toBe(DOM_TYPES.FRAGMENT)
  })

  it('converts string children inside the fragment into text vnodes', () => {
    const vnode = hFragment(['hello'])

    expect(vnode.children[0]).toEqual({ type: DOM_TYPES.TEXT, value: 'hello' })
  })

  it('filters out null children', () => {
    const vnode = hFragment([null, h('div')])

    expect(vnode.children).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// hSlot + didCreateSlot + resetDidCreateSlot
// ---------------------------------------------------------------------------

describe('hSlot', () => {
  beforeEach(() => {
    resetDidCreateSlot()
  })

  it('creates a slot vnode', () => {
    const vnode = hSlot()

    expect(vnode.type).toBe(DOM_TYPES.SLOT)
  })

  it('stores the default children on the slot', () => {
    const defaultContent = [h('p', {}, ['default'])]
    const vnode = hSlot(defaultContent)

    expect(vnode.children).toBe(defaultContent)
  })

  it('defaults children to an empty array when none are provided', () => {
    const vnode = hSlot()

    expect(vnode.children).toEqual([])
  })

  it('sets the didCreateSlot flag to true when called', () => {
    expect(didCreateSlot()).toBe(false)

    hSlot()

    expect(didCreateSlot()).toBe(true)
  })
})

describe('didCreateSlot', () => {
  beforeEach(() => {
    resetDidCreateSlot()
  })

  it('returns false before any hSlot() call in the current render cycle', () => {
    expect(didCreateSlot()).toBe(false)
  })

  it('returns true after hSlot() has been called', () => {
    hSlot()
    expect(didCreateSlot()).toBe(true)
  })
})

describe('resetDidCreateSlot', () => {
  it('clears the slot flag so the next render cycle starts clean', () => {
    hSlot()
    expect(didCreateSlot()).toBe(true)

    resetDidCreateSlot()

    expect(didCreateSlot()).toBe(false)
  })
})

