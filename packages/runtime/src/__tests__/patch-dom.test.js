import { describe, it, expect, vi, beforeEach } from 'vitest'
import { patchDOM } from '../patch-dom.js'
import { mountDOM } from '../mount-dom.js'
import { h, hString, hFragment, hSlot } from '../h.js'
import { defineComponent } from '../component.js'
import { nextTick } from '../scheduler.js'

// Helper: mount a vnode and return it (now has a .el reference).
function mount(vnode, parent) {
  mountDOM(vnode, parent)
  return vnode
}

let container

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
})

// ---------------------------------------------------------------------------
// Incompatible nodes — full replace
// ---------------------------------------------------------------------------

describe('patchDOM — incompatible nodes are replaced', () => {
  it('replaces a text node with an element when types differ', () => {
    const oldVnode = mount(hString('hello'), container)
    const newVnode = h('span', {}, ['world'])

    patchDOM(oldVnode, newVnode, container)

    expect(container.querySelector('span')).not.toBeNull()
    expect(container.textContent).toBe('world')
  })

  it('replaces an element with a different tag', () => {
    const oldVnode = mount(h('div'), container)
    const newVnode = h('section')

    patchDOM(oldVnode, newVnode, container)

    expect(container.querySelector('div')).toBeNull()
    expect(container.querySelector('section')).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Text nodes — in-place text update
// ---------------------------------------------------------------------------

describe('patchDOM — text nodes', () => {
  it('updates the text content when the value changes', () => {
    const oldVnode = mount(hString('before'), container)
    patchDOM(oldVnode, hString('after'), container)

    expect(container.textContent).toBe('after')
  })

  it('does not touch the DOM when the text is unchanged', () => {
    const oldVnode = mount(hString('same'), container)
    const textNode = oldVnode.el
    patchDOM(oldVnode, hString('same'), container)

    expect(container.firstChild).toBe(textNode) // same node, not replaced
    expect(container.textContent).toBe('same')
  })
})

// ---------------------------------------------------------------------------
// Element nodes — attribute / class / style / event patching
// ---------------------------------------------------------------------------

describe('patchDOM — element attribute patching', () => {
  it('adds new attributes', () => {
    const oldVnode = mount(h('input', { type: 'text' }), container)
    patchDOM(oldVnode, h('input', { type: 'text', placeholder: 'Enter…' }), container)

    expect(container.querySelector('input').placeholder).toBe('Enter…')
  })

  it('removes attributes that are no longer present', () => {
    const oldVnode = mount(h('input', { type: 'text', disabled: true }), container)
    patchDOM(oldVnode, h('input', { type: 'text' }), container)

    expect(container.querySelector('input').disabled).toBe(false)
  })

  it('updates attributes whose value changed', () => {
    const oldVnode = mount(h('input', { type: 'text' }), container)
    patchDOM(oldVnode, h('input', { type: 'email' }), container)

    expect(container.querySelector('input').type).toBe('email')
  })
})

describe('patchDOM — class patching', () => {
  it('adds classes that are new', () => {
    const oldVnode = mount(h('div', { class: 'box' }), container)
    patchDOM(oldVnode, h('div', { class: 'box active' }), container)

    expect(container.firstElementChild.classList.contains('active')).toBe(true)
  })

  it('removes classes that were dropped', () => {
    const oldVnode = mount(h('div', { class: 'box active' }), container)
    patchDOM(oldVnode, h('div', { class: 'box' }), container)

    expect(container.firstElementChild.classList.contains('active')).toBe(false)
    expect(container.firstElementChild.classList.contains('box')).toBe(true)
  })
})

describe('patchDOM — style patching', () => {
  it('adds new style properties', () => {
    const oldVnode = mount(h('div', { style: { color: 'red' } }), container)
    patchDOM(oldVnode, h('div', { style: { color: 'red', fontWeight: 'bold' } }), container)

    expect(container.firstElementChild.style.fontWeight).toBe('bold')
  })

  it('removes dropped style properties', () => {
    const oldVnode = mount(h('div', { style: { color: 'red', opacity: '1' } }), container)
    patchDOM(oldVnode, h('div', { style: { color: 'red' } }), container)

    expect(container.firstElementChild.style.opacity).toBe('')
  })

  it('updates changed style values', () => {
    const oldVnode = mount(h('div', { style: { color: 'red' } }), container)
    patchDOM(oldVnode, h('div', { style: { color: 'blue' } }), container)

    expect(container.firstElementChild.style.color).toBe('blue')
  })
})

describe('patchDOM — event patching', () => {
  it('adds new event listeners', () => {
    const handler = vi.fn()
    const oldVnode = mount(h('button'), container)
    patchDOM(oldVnode, h('button', { on: { click: handler } }), container)

    container.querySelector('button').click()

    expect(handler).toHaveBeenCalledOnce()
  })

  it('removes event listeners that are no longer present', () => {
    const handler = vi.fn()
    const oldVnode = mount(h('button', { on: { click: handler } }), container)
    patchDOM(oldVnode, h('button'), container)

    container.querySelector('button').click()

    expect(handler).not.toHaveBeenCalled()
  })

  it('replaces an updated handler with the new one', () => {
    const oldHandler = vi.fn()
    const newHandler = vi.fn()
    const oldVnode = mount(h('button', { on: { click: oldHandler } }), container)

    patchDOM(oldVnode, h('button', { on: { click: newHandler } }), container)
    container.querySelector('button').click()

    expect(oldHandler).not.toHaveBeenCalled()
    expect(newHandler).toHaveBeenCalledOnce()
  })
})

// ---------------------------------------------------------------------------
// Children patching
// ---------------------------------------------------------------------------

describe('patchDOM — children patching', () => {
  it('adds new child nodes', () => {
    const oldVnode = mount(h('ul', {}, [h('li', {}, ['A'])]), container)
    patchDOM(oldVnode, h('ul', {}, [h('li', {}, ['A']), h('li', {}, ['B'])]), container)

    expect(container.querySelectorAll('li')).toHaveLength(2)
  })

  it('removes child nodes that are no longer present', () => {
    const oldVnode = mount(h('ul', {}, [h('li', {}, ['A']), h('li', {}, ['B'])]), container)
    patchDOM(oldVnode, h('ul', {}, [h('li', {}, ['A'])]), container)

    expect(container.querySelectorAll('li')).toHaveLength(1)
  })

  it('moves a child node to a new position using insertBefore', () => {
    const oldVnode = mount(
      h('ul', {}, [h('li', { key: 'a' }, ['A']), h('li', { key: 'b' }, ['B'])]),
      container
    )
    patchDOM(
      oldVnode,
      h('ul', {}, [h('li', { key: 'b' }, ['B']), h('li', { key: 'a' }, ['A'])]),
      container
    )

    const items = container.querySelectorAll('li')
    expect(items[0].textContent).toBe('B')
    expect(items[1].textContent).toBe('A')
  })

  it('updates a child node in-place (NOOP) when it matches', () => {
    const oldVnode = mount(h('div', {}, [h('span', {}, ['hello'])]), container)
    const spanEl = container.querySelector('span')

    patchDOM(oldVnode, h('div', {}, [h('span', {}, ['hello updated'])]), container)

    // The same span element should have been reused (not replaced)
    expect(container.querySelector('span')).toBe(spanEl)
    expect(container.querySelector('span').textContent).toBe('hello updated')
  })
})

// ---------------------------------------------------------------------------
// Component patching
// ---------------------------------------------------------------------------

describe('patchDOM — component patching', () => {
  it('updates component props without unmounting and re-mounting', async () => {
    const onUnmounted = vi.fn()
    const Greeter = defineComponent({
      onUnmounted,
      render() { return h('p', {}, [`Hello ${this.props.name}`]) },
    })

    const oldVnode = mount(h(Greeter, { name: 'Alice' }), container)
    await nextTick()

    patchDOM(oldVnode, h(Greeter, { name: 'Bob' }), container)
    await nextTick()

    expect(container.querySelector('p').textContent).toBe('Hello Bob')
    expect(onUnmounted).not.toHaveBeenCalled() // Component was NOT torn down
  })

  it('transfers the component instance to the new vnode', async () => {
    const Box = defineComponent({ render() { return h('div') } })
    const oldVnode = mount(h(Box), container)
    await nextTick()

    const newVnode = h(Box)
    patchDOM(oldVnode, newVnode, container)

    expect(newVnode.component).toBe(oldVnode.component)
  })

  it('replaces the mounted component when the component class itself changes', async () => {
    const OldComp = defineComponent({ render() { return h('div', { id: 'old-comp' }) } })
    const NewComp = defineComponent({ render() { return h('div', { id: 'new-comp' }) } })

    const oldVnode = mount(h(OldComp), container)
    await nextTick()
    expect(container.querySelector('#old-comp')).not.toBeNull()

    patchDOM(oldVnode, h(NewComp), container)
    await nextTick()

    expect(container.querySelector('#old-comp')).toBeNull()
    expect(container.querySelector('#new-comp')).not.toBeNull()
  })

  it('updates named slot content on patch, without corrupting the DOM (props also change)', async () => {
    const Card = defineComponent({
      render() {
        return h('div', {}, [
          h('div', { class: 'header' }, [hSlot('header', [h('span', {}, ['fallback'])])]),
          h('div', { class: 'footer' }, [hSlot('footer', [h('span', {}, ['fallback'])])]),
        ])
      },
    })

    const oldVnode = mount(
      h(Card, { id: 1 }, { header: [h('h2', {}, ['Header v1'])] }),
      container
    )
    await nextTick()
    expect(container.querySelector('.header').textContent).toBe('Header v1')

    patchDOM(
      oldVnode,
      h(Card, { id: 2 }, { header: [h('h2', {}, ['Header v2'])], footer: [h('button', {}, ['OK'])] }),
      container
    )
    await nextTick()

    expect(container.querySelector('.header').textContent).toBe('Header v2')
    expect(container.querySelector('.footer').textContent).toBe('OK')
    // Nothing should have been mounted directly under the component's own
    // root as a stray sibling of its two rendered divs.
    expect(container.querySelector('div').children).toHaveLength(2)
  })

  it('updates slot content on patch even when props stay identical', async () => {
    const Card = defineComponent({
      render() {
        return h('div', { class: 'body' }, [hSlot([h('span', {}, ['fallback'])])])
      },
    })

    const oldVnode = mount(h(Card, {}, [h('p', {}, ['Body v1'])]), container)
    await nextTick()
    expect(container.querySelector('.body').textContent).toBe('Body v1')

    patchDOM(oldVnode, h(Card, {}, [h('p', {}, ['Body v2'])]), container)
    await nextTick()

    expect(container.querySelector('.body').textContent).toBe('Body v2')
  })
})

// ---------------------------------------------------------------------------
// Keyed children reconciliation
// ---------------------------------------------------------------------------

describe('patchDOM — keyed children reconciliation', () => {
  it('reuses keyed elements across reorders instead of recreating them', () => {
    const oldVnode = mount(
      h('ul', {}, [
        h('li', { key: 'a' }, ['A']),
        h('li', { key: 'b' }, ['B']),
        h('li', { key: 'c' }, ['C']),
      ]),
      container
    )

    // Tag each element so we can verify identity persists across reorder.
    const before = Array.from(container.querySelectorAll('li'))
    before.forEach((el, i) => { el.dataset.id = String(i) })

    patchDOM(
      oldVnode,
      h('ul', {}, [
        h('li', { key: 'c' }, ['C']),
        h('li', { key: 'a' }, ['A']),
        h('li', { key: 'b' }, ['B']),
      ]),
      container
    )

    const after = container.querySelectorAll('li')
    // New order is C, A, B — and each <li> retains its original data-id.
    expect(after[0].dataset.id).toBe('2') // 'c' was originally index 2
    expect(after[1].dataset.id).toBe('0') // 'a' was originally index 0
    expect(after[2].dataset.id).toBe('1') // 'b' was originally index 1
  })
})
