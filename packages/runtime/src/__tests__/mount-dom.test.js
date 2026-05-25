import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountDOM } from '../mount-dom.js'
import { h, hString, hFragment, hSlot } from '../h.js'
import { defineComponent } from '../component.js'
import { nextTick } from '../scheduler.js'

let container

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
})

// ---------------------------------------------------------------------------
// Text nodes
// ---------------------------------------------------------------------------

describe('mountDOM — text nodes', () => {
  it('inserts a text node into the parent element', () => {
    const vnode = hString('hello')
    mountDOM(vnode, container)

    expect(container.textContent).toBe('hello')
  })
})

// ---------------------------------------------------------------------------
// Element nodes
// ---------------------------------------------------------------------------

describe('mountDOM — element nodes', () => {
  it('creates the element with the correct tag', () => {
    const vnode = h('section')
    mountDOM(vnode, container)

    expect(container.firstElementChild.tagName).toBe('SECTION')
  })

  it('applies props (attributes) to the created element', () => {
    const vnode = h('input', { type: 'checkbox', id: 'cb' })
    mountDOM(vnode, container)

    const input = container.querySelector('input')
    expect(input.type).toBe('checkbox')
    expect(input.id).toBe('cb')
  })

  it('attaches event listeners to the element', () => {
    const onClick = vi.fn()
    const vnode = h('button', { on: { click: onClick } })
    mountDOM(vnode, container)

    container.querySelector('button').click()

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('recursively mounts child vnodes inside the element', () => {
    const vnode = h('ul', {}, [h('li', {}, ['Item 1']), h('li', {}, ['Item 2'])])
    mountDOM(vnode, container)

    expect(container.querySelectorAll('li')).toHaveLength(2)
  })

  it('stores a reference to the real DOM element in vnode.el', () => {
    const vnode = h('article')
    mountDOM(vnode, container)

    expect(vnode.el).toBeInstanceOf(HTMLElement)
    expect(vnode.el.tagName).toBe('ARTICLE')
  })
})

// ---------------------------------------------------------------------------
// Fragment nodes
// ---------------------------------------------------------------------------

describe('mountDOM — fragment nodes', () => {
  it('mounts all fragment children directly into the parent (no wrapper element)', () => {
    const frag = hFragment([h('span', {}, ['A']), h('span', {}, ['B'])])
    mountDOM(frag, container)

    expect(container.children).toHaveLength(2)
    expect(container.children[0].tagName).toBe('SPAN')
  })

  it('sets vnode.el to the parent element (since fragments have no own element)', () => {
    const frag = hFragment([h('div')])
    mountDOM(frag, container)

    expect(frag.el).toBe(container)
  })
})

// ---------------------------------------------------------------------------
// Component nodes
// ---------------------------------------------------------------------------

describe('mountDOM — component nodes', () => {
  it('instantiates the component and mounts its rendered output', async () => {
    const Banner = defineComponent({
      render() { return h('header', { id: 'banner' }) },
    })

    const vnode = h(Banner)
    mountDOM(vnode, container)
    await nextTick()

    expect(container.querySelector('#banner')).not.toBeNull()
  })

  it('stores the component instance on the vnode', () => {
    const Box = defineComponent({ render() { return h('div') } })
    const vnode = h(Box)
    mountDOM(vnode, container)

    expect(vnode.component).toBeDefined()
  })

  it('enqueues the onMounted lifecycle hook (not called synchronously)', async () => {
    const onMounted = vi.fn()
    const Box = defineComponent({ onMounted, render() { return h('div') } })
    const vnode = h(Box)

    mountDOM(vnode, container)

    expect(onMounted).not.toHaveBeenCalled() // synchronous check

    await nextTick()

    expect(onMounted).toHaveBeenCalledOnce()
  })

  it('passes props to the component constructor', async () => {
    let receivedProps
    const Greeter = defineComponent({
      render() {
        receivedProps = this.props
        return h('div')
      },
    })

    mountDOM(h(Greeter, { name: 'World' }), container)
    await nextTick() // render is enqueued — wait for it to run

    expect(receivedProps.name).toBe('World')
  })
})

// ---------------------------------------------------------------------------
// Index-based insertion
// ---------------------------------------------------------------------------

describe('mountDOM — index-based insertion', () => {
  it('appends the element when index is null', () => {
    mountDOM(h('span', {}, ['first']), container)
    mountDOM(h('span', {}, ['second']), container, null)

    expect(container.children[1].textContent).toBe('second')
  })

  it('inserts the element at the specified index', () => {
    mountDOM(h('span', {}, ['A']), container)
    mountDOM(h('span', {}, ['C']), container)
    mountDOM(h('span', {}, ['B']), container, 1)

    expect(container.children[1].textContent).toBe('B')
  })

  it('appends when the index is beyond the current children length', () => {
    mountDOM(h('span', {}, ['first']), container)
    mountDOM(h('span', {}, ['last']), container, 99)

    expect(container.children[1].textContent).toBe('last')
  })

  it('throws when a negative index is provided', () => {
    expect(() => mountDOM(h('span'), container, -1)).toThrow()
  })
})

// ---------------------------------------------------------------------------
// Unknown types
// ---------------------------------------------------------------------------

describe('mountDOM — unknown node type', () => {
  it('throws an error for unrecognised vnode types', () => {
    const badVnode = { type: 'unknown' }
    expect(() => mountDOM(badVnode, container)).toThrow("Can't mount DOM of type: unknown")
  })
})
