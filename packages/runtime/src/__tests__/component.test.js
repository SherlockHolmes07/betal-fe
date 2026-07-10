import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineComponent } from '../component.js'
import { h, hFragment, hSlot } from '../h.js'
import { mountDOM } from '../mount-dom.js'
import { destroyDOM } from '../destroy-dom.js'
import { nextTick } from '../scheduler.js'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

// A minimal container to mount components into.
let container

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
})

/**
 * Creates and mounts a component via mountDOM so lifecycle hooks (onMounted,
 * onUnmounted) are enqueued exactly as they would be in a real app.
 *
 * Going through mountDOM for a COMPONENT vnode is what triggers the
 * enqueueJob(() => component.onMounted()) call — direct component.mount()
 * does NOT enqueue it.
 */
function mountComponent(config, props = {}) {
  const Component = defineComponent(config)
  const vnode = h(Component, props)
  mountDOM(vnode, container)
  return vnode.component
}

// ---------------------------------------------------------------------------
// defineComponent — class creation
// ---------------------------------------------------------------------------

describe('defineComponent', () => {
  it('returns a constructor function (class)', () => {
    const Comp = defineComponent({ render() { return h('div') } })
    expect(typeof Comp).toBe('function')
  })

  it('mixes custom methods directly onto the component prototype', () => {
    const instance = mountComponent({
      greet() { return 'hello' },
      render() { return h('div') },
    })
    expect(instance.greet()).toBe('hello')
  })

  it('throws when a custom method collides with a built-in instance method', () => {
    expect(() => {
      defineComponent({
        render() { return h('div') },
        emit() { return 'oops' },
      })
    }).toThrow('Method "emit()" already exists in the component')
  })

  it('throws when a custom method collides with mount()', () => {
    expect(() => {
      defineComponent({
        render() { return h('div') },
        mount() { return 'oops' },
      })
    }).toThrow('Method "mount()" already exists in the component')
  })
})

// ---------------------------------------------------------------------------
// State initialisation
// ---------------------------------------------------------------------------

describe('state()', () => {
  it('initialises state from the state() function', () => {
    const instance = mountComponent({
      state: () => ({ count: 0 }),
      render() { return h('div', {}, [String(this.state.count)]) },
    })

    expect(instance.state.count).toBe(0)
  })

  it('passes initial props to the state() function so state can depend on props', () => {
    const instance = mountComponent(
      {
        state: (props) => ({ doubled: props.value * 2 }),
        render() { return h('div') },
      },
      { value: 5 }
    )

    expect(instance.state.doubled).toBe(10)
  })

  it('defaults state to {} when no state() function is provided', () => {
    const instance = mountComponent({ render() { return h('div') } })
    expect(instance.state).toEqual({})
  })
})

// ---------------------------------------------------------------------------
// mount() and unmount()
// ---------------------------------------------------------------------------

describe('mount()', () => {
  it('inserts the component rendered output into the host element', () => {
    mountComponent({ render() { return h('article', { id: 'my-article' }) } })

    expect(container.querySelector('#my-article')).not.toBeNull()
  })

  it('throws if the component is mounted a second time without unmounting first', () => {
    const instance = mountComponent({ render() { return h('div') } })

    expect(() => instance.mount(container)).toThrow('Component is already mounted')
  })
})

describe('unmount()', () => {
  it('removes the component DOM from its host element', () => {
    const instance = mountComponent({ render() { return h('div', { id: 'bye' }) } })
    expect(container.querySelector('#bye')).not.toBeNull()

    instance.unmount()

    expect(container.querySelector('#bye')).toBeNull()
  })

  it('throws if unmount is called before mount', () => {
    const Comp = defineComponent({ render() { return h('div') } })
    const instance = new Comp()

    expect(() => instance.unmount()).toThrow('Component is not mounted')
  })

  it('allows the component to be re-mounted after unmounting', () => {
    const instance = mountComponent({ render() { return h('div', { id: 'x' }) } })
    instance.unmount()

    // Re-mount should not throw
    instance.mount(container)

    expect(container.querySelector('#x')).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// updateState()
// ---------------------------------------------------------------------------

describe('updateState()', () => {
  it('merges the new state into the existing state', () => {
    const instance = mountComponent({
      state: () => ({ a: 1, b: 2 }),
      render() { return h('div') },
    })

    instance.updateState({ b: 99 })

    expect(instance.state).toMatchObject({ a: 1, b: 99 })
  })

  it('triggers a DOM re-render reflecting the new state', async () => {
    const instance = mountComponent({
      state: () => ({ label: 'initial' }),
      render() { return h('p', { id: 'label' }, [this.state.label]) },
    })

    instance.updateState({ label: 'updated' })

    expect(container.querySelector('#label').textContent).toBe('updated')
  })

  it('throws if called before the component is mounted', () => {
    const Comp = defineComponent({
      state: () => ({ count: 0 }),
      render() { return h('div') },
    })
    const instance = new Comp()

    expect(() => instance.updateState({ count: 1 })).toThrow('Component is not mounted')
  })
})

// ---------------------------------------------------------------------------
// updateProps()
// ---------------------------------------------------------------------------

describe('updateProps()', () => {
  it('re-renders when props change', async () => {
    const instance = mountComponent(
      { render() { return h('p', { id: 'p' }, [this.props.name]) } },
      { name: 'Alice' }
    )

    instance.updateProps({ name: 'Bob' })

    expect(container.querySelector('#p').textContent).toBe('Bob')
  })

  it('skips re-render when the new props are deeply equal to the current props', () => {
    const renderSpy = vi.fn(() => h('div'))
    const instance = mountComponent({ render: renderSpy }, { x: 1 })

    const callsBefore = renderSpy.mock.calls.length
    instance.updateProps({ x: 1 }) // same value, deeply equal

    expect(renderSpy.mock.calls.length).toBe(callsBefore) // no extra render
  })
})

// ---------------------------------------------------------------------------
// Lifecycle hooks
// ---------------------------------------------------------------------------

describe('onMounted()', () => {
  it('is called after the component is inserted into the DOM', async () => {
    const onMounted = vi.fn()
    mountComponent({ onMounted, render() { return h('div') } })

    expect(onMounted).not.toHaveBeenCalled() // deferred

    await nextTick()

    expect(onMounted).toHaveBeenCalledOnce()
  })
})

describe('onUnmounted()', () => {
  it('is enqueued after the component is removed from the DOM', async () => {
    // onUnmounted is enqueued by destroyDOM when it processes a COMPONENT vnode.
    // Calling component.unmount() directly only destroys the inner element vnode,
    // so we use destroyDOM on the component vnode to exercise the real path.
    const onUnmounted = vi.fn()
    const Component = defineComponent({ onUnmounted, render() { return h('div') } })
    const vnode = h(Component, {})
    mountDOM(vnode, container)
    await nextTick()

    destroyDOM(vnode)

    expect(onUnmounted).not.toHaveBeenCalled() // deferred — not yet run
    await nextTick()
    expect(onUnmounted).toHaveBeenCalledOnce()
  })
})

describe('onStateChange()', () => {
  it('is enqueued after a state update', async () => {
    const onStateChange = vi.fn()
    const instance = mountComponent({
      state: () => ({ n: 0 }),
      onStateChange,
      render() { return h('div') },
    })
    await nextTick()

    instance.updateState({ n: 1 })

    expect(onStateChange).not.toHaveBeenCalled()
    await nextTick()
    expect(onStateChange).toHaveBeenCalledOnce()
  })
})

describe('onPropsChange()', () => {
  it('is enqueued with new and old props after a props update', async () => {
    const onPropsChange = vi.fn()
    const instance = mountComponent(
      { onPropsChange, render() { return h('div') } },
      { value: 1 }
    )
    await nextTick()

    instance.updateProps({ value: 2 })
    await nextTick()

    expect(onPropsChange).toHaveBeenCalledWith({ value: 2 }, { value: 1 })
  })
})

// ---------------------------------------------------------------------------
// emit() — child-to-parent events
// ---------------------------------------------------------------------------

describe('emit()', () => {
  it('triggers the matching handler on the parent via the "on" prop', () => {
    const onAdd = vi.fn()
    const Child = defineComponent({
      render() {
        return h('button', { on: { click: () => this.emit('add', 42) } })
      },
    })

    // Simulate a parent wiring up the event
    const childInstance = new Child({}, { add: onAdd })
    childInstance.mount(container)

    container.querySelector('button').click()

    expect(onAdd).toHaveBeenCalledWith(42)
  })
})

// ---------------------------------------------------------------------------
// Slots
// ---------------------------------------------------------------------------

describe('slot support', () => {
  it('renders external slot content provided by the parent', () => {
    const Card = defineComponent({
      render() {
        return h('div', { class: 'card' }, [hSlot()])
      },
    })

    const CardInstance = new Card({}, {})
    CardInstance.setExternalContent([h('p', { id: 'slotted' }, ['slot content'])])
    CardInstance.mount(container)

    expect(container.querySelector('#slotted')).not.toBeNull()
  })

  it('renders the slot default content when the parent provides nothing', () => {
    const Card = defineComponent({
      render() {
        return h('div', { class: 'card' }, [hSlot([h('p', { id: 'default' })])])
      },
    })

    const CardInstance = new Card()
    CardInstance.setExternalContent([])
    CardInstance.mount(container)

    expect(container.querySelector('#default')).not.toBeNull()
  })

  it('renders multiple named slots into their matching locations', () => {
    const Card = defineComponent({
      render() {
        return h('div', { class: 'card' }, [
          h('header', {}, [hSlot('header')]),
          h('main', {}, [hSlot()]),
          h('footer', {}, [hSlot('footer')]),
        ])
      },
    })

    const CardInstance = new Card()
    CardInstance.setExternalContent({
      header: [h('h2', { id: 'header' }, ['Title'])],
      default: [h('p', { id: 'body' }, ['Body'])],
      footer: [h('button', { id: 'footer' }, ['OK'])],
    })
    CardInstance.mount(container)

    expect(container.querySelector('header #header')).not.toBeNull()
    expect(container.querySelector('main #body')).not.toBeNull()
    expect(container.querySelector('footer #footer')).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// setExternalContent()
// ---------------------------------------------------------------------------

describe('setExternalContent()', () => {
  it('re-renders immediately when content changes on an already-mounted component', () => {
    const renderFn = vi.fn(() => h('div', {}, [hSlot()]))
    const Card = defineComponent({ render: renderFn })

    const instance = new Card()
    instance.setExternalContent([h('p', { id: 'v1' })])
    instance.mount(container)
    const callsAfterMount = renderFn.mock.calls.length

    instance.setExternalContent([h('p', { id: 'v2' })])

    expect(renderFn.mock.calls.length).toBe(callsAfterMount + 1)
    expect(container.querySelector('#v2')).not.toBeNull()
    expect(container.querySelector('#v1')).toBeNull()
  })

  it('re-renders on every call while mounted, even if the content is the same array reference', () => {
    // No change-detection, by design (see setExternalContent's docstring) —
    // it always patches once mounted, same as updateState.
    const renderFn = vi.fn(() => h('div', {}, [hSlot()]))
    const Card = defineComponent({ render: renderFn })

    const content = [h('p', { id: 'v1' })]
    const instance = new Card()
    instance.setExternalContent(content)
    instance.mount(container)
    const callsAfterMount = renderFn.mock.calls.length

    instance.setExternalContent(content)

    expect(renderFn.mock.calls.length).toBe(callsAfterMount + 1)
  })

  it('does not throw when called before the component is mounted', () => {
    const Card = defineComponent({ render() { return h('div', {}, [hSlot()]) } })
    const instance = new Card()

    expect(() => instance.setExternalContent([h('p')])).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// App context
// ---------------------------------------------------------------------------

describe('appContext', () => {
  it('is accessible via this.appContext inside render()', () => {
    let capturedContext
    const router = { navigate: vi.fn() }

    const Page = defineComponent({
      render() {
        capturedContext = this.appContext
        return h('div')
      },
    })

    const instance = new Page()
    instance.setAppContext({ router })
    instance.mount(container)

    expect(capturedContext).toEqual({ router })
  })
})

// ---------------------------------------------------------------------------
// elements and firstElement getters
// ---------------------------------------------------------------------------

describe('elements getter', () => {
  it('returns the single root element for a non-fragment component', () => {
    const instance = mountComponent({ render() { return h('main') } })
    expect(instance.elements).toHaveLength(1)
    expect(instance.elements[0].tagName).toBe('MAIN')
  })

  it('returns all elements for a fragment-rooted component', () => {
    const instance = mountComponent({
      render() {
        return hFragment([h('header'), h('footer')])
      },
    })

    expect(instance.elements).toHaveLength(2)
  })

  it('returns an empty array before mounting', () => {
    const Comp = defineComponent({ render() { return h('div') } })
    const instance = new Comp()
    expect(instance.elements).toEqual([])
  })
})

describe('firstElement getter', () => {
  it('returns the first DOM element of the component', () => {
    const instance = mountComponent({ render() { return h('nav') } })
    expect(instance.firstElement.tagName).toBe('NAV')
  })
})

// ---------------------------------------------------------------------------
// offset getter
// ---------------------------------------------------------------------------

describe('offset getter', () => {
  it('returns 0 for a non-fragment component', () => {
    const instance = mountComponent({ render() { return h('div') } })
    expect(instance.offset).toBe(0)
  })

  it('returns the index of the first element for a fragment-rooted component', () => {
    // Add a pre-existing sibling so the fragment does not start at index 0
    container.appendChild(document.createElement('span'))

    const instance = mountComponent({
      render() { return hFragment([h('p'), h('p')]) },
    })

    // The fragment's first <p> is at index 1 (after the pre-existing <span>)
    expect(instance.offset).toBe(1)
  })
})
