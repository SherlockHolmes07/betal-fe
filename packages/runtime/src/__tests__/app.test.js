import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createBetalApp } from '../app.js'
import { defineComponent } from '../component.js'
import { h } from '../h.js'
import { HashRouter, NoopRouter } from '../router.js'
import { nextTick } from '../scheduler.js'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

let container

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  window.history.replaceState({}, '', '#/')
})

// Remove containers and flush pending microtasks after each test so that
// unrelated setTimeout callbacks or stale event listeners from one test
// cannot interfere with the next.
afterEach(async () => {
  await nextTick()
  document.body.innerHTML = ''
})

const SimpleRoot = defineComponent({
  render() { return h('main', { id: 'root' }) },
})

// ---------------------------------------------------------------------------
// mount()
// ---------------------------------------------------------------------------

describe('createBetalApp — mount()', () => {
  it('inserts the root component into the target container element', async () => {
    const app = createBetalApp(SimpleRoot)
    app.mount(container)
    await nextTick()

    expect(container.querySelector('#root')).not.toBeNull()
  })

  it('throws if mount() is called a second time without unmounting first', () => {
    const app = createBetalApp(SimpleRoot)
    app.mount(container)

    expect(() => app.mount(container)).toThrow('The application is already mounted')
  })

  it('passes props to the root component', async () => {
    let capturedProps
    const PropsRoot = defineComponent({
      render() {
        capturedProps = this.props
        return h('div')
      },
    })

    const app = createBetalApp(PropsRoot, { title: 'Hello' })
    app.mount(container)

    expect(capturedProps.title).toBe('Hello')
  })

  it('exposes a NoopRouter via appContext when no router is provided', async () => {
    let capturedRouter
    const ContextProbe = defineComponent({
      render() {
        capturedRouter = this.appContext.router
        return h('div')
      },
    })

    const app = createBetalApp(ContextProbe)
    app.mount(container)

    expect(capturedRouter).toBeInstanceOf(NoopRouter)
  })

  it('initialises the router during mount when one is provided', async () => {
    const router = new HashRouter([{ path: '/', component: SimpleRoot }])
    const init = vi.spyOn(router, 'init')

    const app = createBetalApp(SimpleRoot, {}, { router })
    app.mount(container)

    expect(init).toHaveBeenCalledOnce()

    // Clean up: stop the router so its popstate listener and any pending
    // async navigation work do not bleed into subsequent tests.
    app.unmount()
  })
})

// ---------------------------------------------------------------------------
// unmount()
// ---------------------------------------------------------------------------

describe('createBetalApp — unmount()', () => {
  it('removes the root component DOM from the container', async () => {
    const app = createBetalApp(SimpleRoot)
    app.mount(container)
    await nextTick()

    app.unmount()

    expect(container.querySelector('#root')).toBeNull()
  })

  it('throws if unmount() is called before mount()', () => {
    const app = createBetalApp(SimpleRoot)

    expect(() => app.unmount()).toThrow('The application is not mounted')
  })

  it('calls router.destroy() on unmount', async () => {
    const router = new HashRouter([])
    await router.init()
    const destroy = vi.spyOn(router, 'destroy')

    const app = createBetalApp(SimpleRoot, {}, { router })
    app.mount(container)
    app.unmount()

    expect(destroy).toHaveBeenCalledOnce()
  })

  it('allows re-mounting after unmounting', async () => {
    const app = createBetalApp(SimpleRoot)
    app.mount(container)
    await nextTick()
    app.unmount()

    app.mount(container)
    await nextTick()

    expect(container.querySelector('#root')).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// App context propagation
// ---------------------------------------------------------------------------

describe('createBetalApp — app context', () => {
  it('makes the router accessible to components via this.appContext.router', async () => {
    let capturedRouter
    const router = new HashRouter([])

    const ContextRoot = defineComponent({
      render() {
        capturedRouter = this.appContext.router
        return h('div')
      },
    })

    const app = createBetalApp(ContextRoot, {}, { router })
    app.mount(container)

    expect(capturedRouter).toBe(router)
    router.destroy()
  })
})
