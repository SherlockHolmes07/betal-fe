import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RouterLink, RouterOutlet } from '../router-components.js'
import { h } from '../h.js'
import { HashRouter, NoopRouter } from '../router.js'
import { defineComponent } from '../component.js'
import { mountDOM } from '../mount-dom.js'
import { destroyDOM } from '../destroy-dom.js'
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

// Builds a minimal appContext object that router components expect.
function makeAppContext(router) {
  return { router }
}

// A fake router with just enough surface for RouterLink: navigateTo() to
// spy on, and linkHref() since render() now calls it unconditionally to
// build the anchor's href. Defaults linkHref to the hash-style "#<to>"
// (matching HashRouter) so existing tests don't need to care about it
// unless they're specifically testing linkHref itself.
function makeFakeRouter(overrides = {}) {
  return {
    navigateTo: vi.fn(),
    linkHref: vi.fn((to) => `#${to}`),
    ...overrides,
  }
}

/**
 * Mounts a component through mountDOM so lifecycle hooks such as onMounted
 * are properly enqueued. RouterOutlet subscribes to the router inside its
 * onMounted hook, which only fires when the component is mounted via the
 * full mountDOM path (not direct component.mount()).
 */
function mountWithContext(ComponentClass, props = {}, appContext = {}, children = []) {
  const vnode = h(ComponentClass, props, children)
  mountDOM(vnode, container, null, { appContext })
  return vnode.component
}

// ---------------------------------------------------------------------------
// RouterLink
// ---------------------------------------------------------------------------

describe('RouterLink', () => {
  it('renders an anchor tag', () => {
    const router = makeFakeRouter()
    mountWithContext(RouterLink, { to: '/about' }, makeAppContext(router))

    expect(container.querySelector('a')).not.toBeNull()
  })

  it('sets the href to "#<to>" so right-click → open in new tab works', () => {
    const router = makeFakeRouter()
    mountWithContext(RouterLink, { to: '/about' }, makeAppContext(router))

    expect(container.querySelector('a').getAttribute('href')).toBe('#/about')
  })

  it('formats the href via router.linkHref(), not a hardcoded "#" — e.g. bare path under BrowserRouter', () => {
    const router = makeFakeRouter({ linkHref: (to) => to })
    mountWithContext(RouterLink, { to: '/about' }, makeAppContext(router))

    expect(container.querySelector('a').getAttribute('href')).toBe('/about')
  })

  it('renders correctly and never throws when the app has no real router configured (NoopRouter)', () => {
    // Not just a fake mock this time — the actual class createBetalApp falls
    // back to when no router option is passed, so linkHref() and click both
    // need to work against the real thing, not just an object shaped like it.
    mountWithContext(RouterLink, { to: '/about' }, makeAppContext(new NoopRouter()))

    const anchor = container.querySelector('a')
    expect(anchor.getAttribute('href')).toBe('/about')
    expect(() => anchor.click()).not.toThrow()
  })

  it('calls router.navigateTo with the "to" path when the link is clicked', () => {
    const router = makeFakeRouter()
    mountWithContext(RouterLink, { to: '/contact' }, makeAppContext(router))

    container.querySelector('a').click()

    expect(router.navigateTo).toHaveBeenCalledWith('/contact')
  })

  it('prevents the default anchor navigation so there is no full-page reload', () => {
    const router = makeFakeRouter()
    mountWithContext(RouterLink, { to: '/' }, makeAppContext(router))

    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    container.querySelector('a').dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
  })

  it('forwards additional props (class, id, etc.) to the anchor element', () => {
    const router = makeFakeRouter()
    mountWithContext(RouterLink, { to: '/', class: 'nav-link', id: 'home-link' }, makeAppContext(router))

    const anchor = container.querySelector('a')
    expect(anchor.className).toBe('nav-link')
    expect(anchor.id).toBe('home-link')
  })

  it('renders slot content (children) inside the anchor', () => {
    const router = makeFakeRouter()
    mountWithContext(
      RouterLink,
      { to: '/' },
      makeAppContext(router),
      [h('strong', { id: 'label' }, ['Home'])]
    )

    expect(container.querySelector('#label')).not.toBeNull()
  })

  it('forwards the full "to" value (including hash fragment) to navigateTo', () => {
    // The router itself is responsible for parsing the hash fragment;
    // RouterLink's job is to pass the path through unchanged.
    const router = makeFakeRouter()
    mountWithContext(RouterLink, { to: '/about#section' }, makeAppContext(router))

    container.querySelector('a').click()

    expect(router.navigateTo).toHaveBeenCalledWith('/about#section')
  })
})

// ---------------------------------------------------------------------------
// RouterOutlet
// ---------------------------------------------------------------------------

describe('RouterOutlet', () => {
  it('renders nothing when no route is currently matched', async () => {
    const router = new HashRouter([], {})
    await router.init()

    mountWithContext(RouterOutlet, {}, makeAppContext(router))
    await nextTick()

    // The outlet wrapper div should have no children (no matched route component)
    const outlet = container.querySelector('#router-outlet')
    expect(outlet).not.toBeNull()
    expect(outlet.children).toHaveLength(0)

    router.destroy()
  })

  it('renders the matched route component after navigating to a route', async () => {
    const ProfilePage = defineComponent({ render() { return h('div', { id: 'profile' }) } })
    const router = new HashRouter([{ path: '/profile', component: ProfilePage }])
    await router.init()

    mountWithContext(RouterOutlet, {}, makeAppContext(router))
    await nextTick()

    await router.navigateTo('/profile')
    await nextTick()

    expect(container.querySelector('#profile')).not.toBeNull()

    router.destroy()
  })

  it('swaps the component when the route changes', async () => {
    const PageA = defineComponent({ render() { return h('div', { id: 'page-a' }) } })
    const PageB = defineComponent({ render() { return h('div', { id: 'page-b' }) } })

    const router = new HashRouter([
      { path: '/a', component: PageA },
      { path: '/b', component: PageB },
    ])
    await router.init()

    mountWithContext(RouterOutlet, {}, makeAppContext(router))
    await nextTick()

    await router.navigateTo('/a')
    await nextTick()
    expect(container.querySelector('#page-a')).not.toBeNull()

    await router.navigateTo('/b')
    await nextTick()
    expect(container.querySelector('#page-a')).toBeNull()
    expect(container.querySelector('#page-b')).not.toBeNull()

    router.destroy()
  })

  it('unsubscribes from the router when unmounted to prevent memory leaks', async () => {
    // RouterOutlet.onUnmounted calls router.unsubscribe(). That hook is only
    // enqueued when destroyDOM processes the COMPONENT vnode — NOT when
    // component.unmount() is called directly (which only destroys the inner
    // element vnode). So we keep the vnode around and destroy it explicitly.
    const router = new HashRouter([{ path: '/', component: defineComponent({ render() { return h('div') } }) }])
    await router.init()

    const vnode = h(RouterOutlet, {})
    mountDOM(vnode, container, null, { appContext: makeAppContext(router) })
    await nextTick()

    const unsubscribe = vi.spyOn(router, 'unsubscribe')
    destroyDOM(vnode)
    await nextTick()

    expect(unsubscribe).toHaveBeenCalled()

    router.destroy()
  })

  // Regression: onUnmounted used to pass the return value of router.subscribe()
  // (which is `undefined`) to unsubscribe, so the handler was never actually
  // removed. Asserting that unsubscribe was *called* (the test above) passed
  // anyway — unsubscribe(undefined) is still a call. These two check the real
  // effect instead: that a navigation after unmount no longer reaches the
  // dead outlet.
  it('actually stops receiving route events after unmount (not just calls unsubscribe)', async () => {
    const PageA = defineComponent({ render() { return h('div', { id: 'page-a' }) } })
    const PageB = defineComponent({ render() { return h('div', { id: 'page-b' }) } })
    const router = new HashRouter([
      { path: '/a', component: PageA },
      { path: '/b', component: PageB },
    ])
    await router.init()

    const vnode = h(RouterOutlet, {})
    mountDOM(vnode, container, null, { appContext: makeAppContext(router) })
    await nextTick()

    const handleRouteChange = vi.spyOn(vnode.component, 'handleRouteChange')
    destroyDOM(vnode)
    await nextTick()

    await router.navigateTo('/b')
    await nextTick()

    expect(handleRouteChange).not.toHaveBeenCalled()

    router.destroy()
  })

  it('does not throw on navigation after the outlet has unmounted', async () => {
    const PageA = defineComponent({ render() { return h('div', { id: 'page-a' }) } })
    const PageB = defineComponent({ render() { return h('div', { id: 'page-b' }) } })
    const router = new HashRouter([
      { path: '/a', component: PageA },
      { path: '/b', component: PageB },
    ])
    await router.init()

    const vnode = h(RouterOutlet, {})
    mountDOM(vnode, container, null, { appContext: makeAppContext(router) })
    await nextTick()

    destroyDOM(vnode)
    await nextTick()

    // Before the fix, the leaked handler would fire updateState() on the
    // unmounted outlet, and #patch() throws "Component is not mounted".
    await expect(router.navigateTo('/b')).resolves.toBeUndefined()

    router.destroy()
  })
})
