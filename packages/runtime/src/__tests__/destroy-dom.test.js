import { describe, it, expect, vi, beforeEach } from 'vitest'
import { destroyDOM } from '../destroy-dom.js'
import { mountDOM } from '../mount-dom.js'
import { h, hString, hFragment, DOM_TYPES } from '../h.js'
import { nextTick } from '../scheduler.js'
import { defineComponent } from '../component.js'

// Each test mounts into a fresh container so DOM state doesn't bleed between cases.
let container

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
})

// ---------------------------------------------------------------------------
// Text nodes
// ---------------------------------------------------------------------------

describe('destroyDOM — text nodes', () => {
  it('removes a text node from the DOM', () => {
    const vnode = hString('hello')
    mountDOM(vnode, container)

    expect(container.childNodes).toHaveLength(1)
    destroyDOM(vnode)
    expect(container.childNodes).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Element nodes
// ---------------------------------------------------------------------------

describe('destroyDOM — element nodes', () => {
  it('removes the element from the DOM', () => {
    const vnode = h('div', {}, [h('span')])
    mountDOM(vnode, container)

    expect(container.children).toHaveLength(1)
    destroyDOM(vnode)
    expect(container.children).toHaveLength(0)
  })

  it('removes event listeners so they no longer fire after destruction', () => {
    const handler = vi.fn()
    const vnode = h('button', { on: { click: handler } })
    mountDOM(vnode, container)

    // Grab the real button before destroying
    const button = vnode.el
    destroyDOM(vnode)

    button.click()
    expect(handler).not.toHaveBeenCalled()
  })

  it('recursively destroys child vnodes (removing them from the DOM)', () => {
    const parent = h('div', {}, [h('span', { id: 'gone' })])
    mountDOM(parent, container)
    expect(container.querySelector('#gone')).not.toBeNull()

    destroyDOM(parent)

    expect(container.querySelector('#gone')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Fragment nodes
// ---------------------------------------------------------------------------

describe('destroyDOM — fragment nodes', () => {
  it('removes all children of the fragment from the DOM', () => {
    const frag = hFragment([h('span'), h('em')])
    mountDOM(frag, container)

    expect(container.children).toHaveLength(2)
    destroyDOM(frag)
    expect(container.children).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Component nodes
// ---------------------------------------------------------------------------

describe('destroyDOM — component nodes', () => {
  it('calls the component unmount method, removing its DOM elements', async () => {
    const Box = defineComponent({
      render() { return h('div', { class: 'box' }) },
    })
    const vnode = h(Box)
    mountDOM(vnode, container)

    await nextTick() // flush onMounted

    expect(container.children).toHaveLength(1)
    destroyDOM(vnode)
    expect(container.children).toHaveLength(0)
  })

  it('enqueues the onUnmounted lifecycle hook to fire after the current tick', async () => {
    const onUnmounted = vi.fn()
    const Box = defineComponent({
      onUnmounted,
      render() { return h('div') },
    })
    const vnode = h(Box)
    mountDOM(vnode, container)

    await nextTick()
    destroyDOM(vnode)

    expect(onUnmounted).not.toHaveBeenCalled() // not called synchronously
    await nextTick()
    expect(onUnmounted).toHaveBeenCalledOnce()
  })
})

// ---------------------------------------------------------------------------
// Unknown types
// ---------------------------------------------------------------------------

describe('destroyDOM — unknown node type', () => {
  it('throws an error for unrecognised vnode types', () => {
    const badVnode = { type: 'unknown', el: document.createElement('div') }

    expect(() => destroyDOM(badVnode)).toThrow("Can't destroy DOM of type: unknown")
  })
})
