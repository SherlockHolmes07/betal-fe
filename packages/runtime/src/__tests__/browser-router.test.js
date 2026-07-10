import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from '../router.js'
import { defineComponent } from '../component.js'
import { h } from '../h.js'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const HomePage = defineComponent({ render() { return h('div', { id: 'home' }) } })
const AboutPage = defineComponent({ render() { return h('div', { id: 'about' }) } })
const UserPage = defineComponent({ render() { return h('div', { id: 'user' }) } })

async function makeRouter(extraRoutes = [], options = {}) {
  const router = new BrowserRouter(
    [
      { path: '/', component: HomePage },
      { path: '/about', component: AboutPage },
      { path: '/user/:id', component: UserPage },
      ...extraRoutes,
    ],
    options
  )
  await router.init()
  return router
}

beforeEach(() => {
  window.history.replaceState({}, '', '/')
})

// ---------------------------------------------------------------------------
// Strategy-specific behavior — everything else (guards, redirects, scroll,
// subscribe/unsubscribe) is shared with HashRouter and already covered in
// router.test.js.
// ---------------------------------------------------------------------------

describe('BrowserRouter — reads the current path from location.pathname', () => {
  it('matches the current route on init, using pathname (no "#")', async () => {
    window.history.replaceState({}, '', '/about')
    const router = new BrowserRouter([
      { path: '/', component: HomePage },
      { path: '/about', component: AboutPage },
    ])

    await router.init()

    expect(router.matchedRoute?.component).toBe(AboutPage)
    router.destroy()
  })

  it('does not modify the URL on init — pathname is never empty, unlike hash', async () => {
    window.history.replaceState({}, '', '/about')
    const replaceState = vi.spyOn(window.history, 'replaceState')

    const router = await makeRouter()

    expect(replaceState).not.toHaveBeenCalled()
    expect(location.pathname).toBe('/about')
    replaceState.mockRestore()
    router.destroy()
  })
})

describe('BrowserRouter — navigateTo() writes a real path, no "#"', () => {
  it('pushes a new history entry with the bare path', async () => {
    const pushState = vi.spyOn(window.history, 'pushState')
    const router = await makeRouter()

    await router.navigateTo('/about')

    expect(pushState).toHaveBeenCalledWith({}, '', '/about')
    expect(location.hash).toBe('')
    pushState.mockRestore()
    router.destroy()
  })

  it('updates location.pathname to match the new route', async () => {
    const router = await makeRouter()

    await router.navigateTo('/about')

    expect(location.pathname).toBe('/about')
    router.destroy()
  })
})

describe('BrowserRouter — popstate handling', () => {
  it('re-matches the current route from pathname when popstate fires', async () => {
    const router = await makeRouter()
    const handler = vi.fn()
    router.subscribe(handler)

    window.history.replaceState({}, '', '/about')
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }))

    await Promise.resolve()
    await Promise.resolve()

    expect(router.matchedRoute?.component).toBe(AboutPage)
    expect(handler).toHaveBeenCalled()
    router.destroy()
  })
})

describe('BrowserRouter — history synchronization does not corrupt back/forward', () => {
  it('does not push a duplicate history entry on init()', async () => {
    window.history.replaceState({}, '', '/about')
    const pushState = vi.spyOn(window.history, 'pushState')

    const router = await makeRouter()

    expect(pushState).not.toHaveBeenCalled()
    pushState.mockRestore()
    router.destroy()
  })

  it('replaces the current URL when an initial route redirects', async () => {
    window.history.replaceState({}, '', '/old')
    const pushState = vi.spyOn(window.history, 'pushState')
    const replaceState = vi.spyOn(window.history, 'replaceState')

    const router = await makeRouter([
      { path: '/old', redirect: '/about' },
    ])

    expect(pushState).not.toHaveBeenCalled()
    expect(replaceState).toHaveBeenCalledWith({}, '', '/about')
    expect(location.pathname).toBe('/about')
    expect(router.matchedRoute?.component).toBe(AboutPage)

    pushState.mockRestore()
    replaceState.mockRestore()
    router.destroy()
  })

  it('does not push a new history entry when syncing from a popstate event', async () => {
    const router = await makeRouter()
    const pushState = vi.spyOn(window.history, 'pushState')

    window.history.replaceState({}, '', '/about')
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }))
    await Promise.resolve()
    await Promise.resolve()

    expect(pushState).not.toHaveBeenCalled()
    pushState.mockRestore()
    router.destroy()
  })

  it('preserves forward history across a back-then-forward sequence', async () => {
    const router = await makeRouter()

    await router.navigateTo('/about')
    await router.navigateTo('/user/42')

    // Simulate the browser's own back navigation: it moves the history
    // pointer and fires popstate — it does NOT call pushState itself.
    window.history.replaceState({}, '', '/about')
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }))
    await Promise.resolve()
    await Promise.resolve()
    expect(router.matchedRoute?.component).toBe(AboutPage)

    // If the popstate-triggered sync had (incorrectly) called pushState,
    // the real browser's forward history to /user/42 would now be gone.
    // We can't drive real forward() in jsdom, but we can assert the sync
    // itself never touched history — which is what would have destroyed it.
    const pushState = vi.spyOn(window.history, 'pushState')
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }))
    await Promise.resolve()
    await Promise.resolve()
    expect(pushState).not.toHaveBeenCalled()

    pushState.mockRestore()
    router.destroy()
  })
})

describe('BrowserRouter — in-page anchors', () => {
  it('navigating to a path with an anchor produces a real URL hash, and still matches the route', async () => {
    const router = await makeRouter()

    await router.navigateTo('/about#section')

    expect(location.pathname).toBe('/about')
    expect(location.hash).toBe('#section')
    expect(router.matchedRoute?.component).toBe(AboutPage)
    router.destroy()
  })

  it('supports a query string and an anchor together', async () => {
    const router = await makeRouter()

    await router.navigateTo('/user/42?tab=profile#comments')

    expect(location.pathname).toBe('/user/42')
    expect(location.search).toBe('?tab=profile')
    expect(location.hash).toBe('#comments')
    expect(router.params).toEqual({ id: '42' })
    expect(router.query).toEqual({ tab: 'profile' })
    router.destroy()
  })

  it('clears the URL hash when navigating away to a path with no anchor', async () => {
    const router = await makeRouter()
    await router.navigateTo('/about#section')
    expect(location.hash).toBe('#section')

    await router.navigateTo('/')

    expect(location.hash).toBe('')
    expect(location.pathname).toBe('/')
    router.destroy()
  })
})

describe('BrowserRouter — linkHref()', () => {
  it('returns the path unchanged, no "#" prefix', () => {
    const router = new BrowserRouter([])
    expect(router.linkHref('/about')).toBe('/about')
  })
})

// ---------------------------------------------------------------------------
// End-to-end smoke test — catches any accidental hash-string assumption
// leaking through the shared Router pipeline (params/query/guards/
// subscribe/destroy are otherwise fully covered for HashRouter already).
// ---------------------------------------------------------------------------

describe('BrowserRouter — end-to-end smoke test', () => {
  it('handles params, query, a redirecting guard, subscribe, and destroy together', async () => {
    const router = await makeRouter([
      { path: '/admin', redirect: '/user/1' },
      { path: '/guarded-block', component: AboutPage, beforeEnter: () => false },
      { path: '/guarded-allow', component: AboutPage, beforeEnter: () => true },
    ])
    const handler = vi.fn()
    router.subscribe(handler)

    // Redirect
    await router.navigateTo('/admin')
    expect(router.matchedRoute?.component).toBe(UserPage)
    expect(router.params).toEqual({ id: '1' })
    expect(location.pathname).toBe('/user/1')

    // Params + query together
    await router.navigateTo('/user/42?tab=profile')
    expect(router.params).toEqual({ id: '42' })
    expect(router.query).toEqual({ tab: 'profile' })

    // Guard blocks
    const beforeBlock = router.matchedRoute
    await router.navigateTo('/guarded-block')
    expect(router.matchedRoute).toBe(beforeBlock)

    // Guard allows
    await router.navigateTo('/guarded-allow')
    expect(router.matchedRoute?.component).toBe(AboutPage)

    expect(handler).toHaveBeenCalledTimes(3) // admin->user/1, user/42, guarded-allow (guarded-block was blocked)

    router.destroy()
    expect(() => router.destroy()).not.toThrow() // idempotent
  })
})
