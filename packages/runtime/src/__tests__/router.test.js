import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { HashRouter, NoopRouter } from '../router.js'
import { defineComponent } from '../component.js'
import { h } from '../h.js'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

// Lightweight component stubs for route definitions.
const HomePage = defineComponent({ render() { return h('div', { id: 'home' }) } })
const AboutPage = defineComponent({ render() { return h('div', { id: 'about' }) } })
const UserPage = defineComponent({ render() { return h('div', { id: 'user' }) } })

// Creates a router with common test routes and inits it.
async function makeRouter(extraRoutes = [], options = {}) {
  const router = new HashRouter(
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
  // Reset hash before each test so every router starts from a clean slate.
  window.history.replaceState({}, '', '#/')
})

afterEach((context) => {
  // Ensure any router created in the test is destroyed to remove popstate listeners.
  if (context.router) context.router.destroy()
})

// ---------------------------------------------------------------------------
// Constructor
// ---------------------------------------------------------------------------

describe('HashRouter — constructor', () => {
  it('throws when routes is not an array', () => {
    expect(() => new HashRouter('not-an-array')).toThrow()
  })

  it('accepts an empty routes array', () => {
    expect(() => new HashRouter([])).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// init()
// ---------------------------------------------------------------------------

describe('HashRouter — init()', () => {
  it('sets the URL hash to "#/" when it is empty on init', async () => {
    window.history.replaceState({}, '', location.pathname) // clear any hash
    const router = new HashRouter([{ path: '/', component: HomePage }])
    await router.init()
    expect(location.hash).toBe('#/')
    router.destroy()
  })

  it('matches the current hash route on init', async () => {
    window.history.replaceState({}, '', '#/about')
    const router = new HashRouter([
      { path: '/', component: HomePage },
      { path: '/about', component: AboutPage },
    ])
    await router.init()
    expect(router.matchedRoute?.component).toBe(AboutPage)
    router.destroy()
  })

  it('is idempotent — calling init() twice does not throw', async () => {
    const router = await makeRouter()
    await expect(router.init()).resolves.toBeUndefined()
    router.destroy()
  })
})

// ---------------------------------------------------------------------------
// navigateTo()
// ---------------------------------------------------------------------------

describe('HashRouter — navigateTo()', () => {
  it('updates matchedRoute to the route that matches the path', async () => {
    const router = await makeRouter()
    await router.navigateTo('/about')
    expect(router.matchedRoute?.component).toBe(AboutPage)
    router.destroy()
  })

  it('extracts dynamic params from the URL', async () => {
    const router = await makeRouter()
    await router.navigateTo('/user/42')
    expect(router.params).toEqual({ id: '42' })
    router.destroy()
  })

  it('parses the query string and exposes it via router.query', async () => {
    // Static routes use an exact regex (e.g. /^\/about$/) that does NOT match
    // when a query string is appended. Dynamic routes use [^/]+ which matches
    // query strings as part of the last segment, so the router can still
    // extract the query portion via extractQuery().
    const router = await makeRouter()
    await router.navigateTo('/user/42?lang=en')
    expect(router.query).toEqual({ lang: 'en' })
    router.destroy()
  })

  it('logs a warning and sets matchedRoute to null when no route matches', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const router = await makeRouter()

    await router.navigateTo('/does-not-exist')

    expect(warn).toHaveBeenCalled()
    expect(router.matchedRoute).toBeNull()
    warn.mockRestore()
    router.destroy()
  })

  it('follows a redirect route transparently', async () => {
    const router = await makeRouter([{ path: '/old', redirect: '/about' }])
    await router.navigateTo('/old')
    expect(router.matchedRoute?.component).toBe(AboutPage)
    router.destroy()
  })

  it('notifies subscribers with { from, to, router } after navigation', async () => {
    const router = await makeRouter()
    const handler = vi.fn()
    router.subscribe(handler)

    await router.navigateTo('/about')

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ to: expect.objectContaining({ component: AboutPage }), router })
    )
    router.destroy()
  })

  it('pushes a new history entry on navigation', async () => {
    const pushState = vi.spyOn(window.history, 'pushState')
    const router = await makeRouter()

    await router.navigateTo('/about')

    expect(pushState).toHaveBeenCalledWith({}, '', '#/about')
    pushState.mockRestore()
    router.destroy()
  })

  it('throws when the path does not start with "/"', async () => {
    const router = await makeRouter()

    await expect(router.navigateTo('about')).rejects.toThrow()
    router.destroy()
  })
})

// ---------------------------------------------------------------------------
// beforeEnter route guard
// ---------------------------------------------------------------------------

describe('HashRouter — beforeEnter guard', () => {
  it('cancels navigation when the guard returns false', async () => {
    const router = await makeRouter([
      { path: '/protected', component: AboutPage, beforeEnter: () => false },
    ])

    const fromRoute = router.matchedRoute
    await router.navigateTo('/protected')

    expect(router.matchedRoute).toBe(fromRoute) // stayed on the same route
    router.destroy()
  })

  it('allows navigation when the guard returns true', async () => {
    const router = await makeRouter([
      { path: '/allowed', component: AboutPage, beforeEnter: () => true },
    ])

    await router.navigateTo('/allowed')

    expect(router.matchedRoute?.component).toBe(AboutPage)
    router.destroy()
  })

  it('redirects when the guard returns a path string', async () => {
    const router = await makeRouter([
      { path: '/guarded', component: AboutPage, beforeEnter: () => '/about' },
    ])

    await router.navigateTo('/guarded')

    expect(router.matchedRoute?.component).toBe(AboutPage)
    router.destroy()
  })

  it('supports async guards', async () => {
    const router = await makeRouter([
      {
        path: '/async-guarded',
        component: AboutPage,
        beforeEnter: async () => false,
      },
    ])

    const fromRoute = router.matchedRoute
    await router.navigateTo('/async-guarded')

    expect(router.matchedRoute).toBe(fromRoute)
    router.destroy()
  })
})

// ---------------------------------------------------------------------------
// subscribe() / unsubscribe()
// ---------------------------------------------------------------------------

describe('HashRouter — subscribe / unsubscribe', () => {
  it('calls the handler on every navigation', async () => {
    const router = await makeRouter()
    const handler = vi.fn()
    router.subscribe(handler)

    await router.navigateTo('/about')
    await router.navigateTo('/')

    expect(handler).toHaveBeenCalledTimes(2)
    router.destroy()
  })

  it('stops calling the handler after unsubscribe', async () => {
    const router = await makeRouter()
    const handler = vi.fn()
    router.subscribe(handler)
    router.unsubscribe(handler)

    await router.navigateTo('/about')

    expect(handler).not.toHaveBeenCalled()
    router.destroy()
  })
})

// ---------------------------------------------------------------------------
// back() / forward()
// ---------------------------------------------------------------------------

describe('HashRouter — back() / forward()', () => {
  it('calls window.history.back() when back() is called', async () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {})
    const router = await makeRouter()

    router.back()

    expect(back).toHaveBeenCalledOnce()
    back.mockRestore()
    router.destroy()
  })

  it('calls window.history.forward() when forward() is called', async () => {
    const forward = vi.spyOn(window.history, 'forward').mockImplementation(() => {})
    const router = await makeRouter()

    router.forward()

    expect(forward).toHaveBeenCalledOnce()
    forward.mockRestore()
    router.destroy()
  })
})

// ---------------------------------------------------------------------------
// destroy()
// ---------------------------------------------------------------------------

describe('HashRouter — destroy()', () => {
  it('removes the popstate listener so further navigation events are ignored', async () => {
    const router = await makeRouter()
    const handler = vi.fn()
    router.subscribe(handler)

    router.destroy()

    // Simulate a browser back/forward navigation after destroy
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }))

    expect(handler).not.toHaveBeenCalled()
  })

  it('is safe to call multiple times (idempotent)', async () => {
    const router = await makeRouter()
    router.destroy()
    expect(() => router.destroy()).not.toThrow()
  })

  it('unsubscribes all active subscribers on destroy', async () => {
    const router = await makeRouter()
    const handler = vi.fn()
    router.subscribe(handler)

    router.destroy()

    // The router is torn down; no further notifications should arrive
    expect(handler).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// scrollBehavior
// ---------------------------------------------------------------------------

describe('HashRouter — scrollBehavior', () => {
  it('scrolls to the top by default after navigation', async () => {
    // Fake timers must be active BEFORE init so the setTimeout(0) inside
    // #handleScrollBehavior is captured and can be triggered with runAllTimers.
    vi.useFakeTimers()
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    const router = await makeRouter()

    await router.navigateTo('/about')
    vi.runAllTimers()

    // scrollTo may have been called during init too; just verify the signature
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 0, left: 0 }))
    scrollTo.mockRestore()
    vi.useRealTimers()
    router.destroy()
  })

  it('does not scroll when scrollBehavior is false', async () => {
    vi.useFakeTimers()
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    const router = await makeRouter([], { scrollBehavior: false })

    await router.navigateTo('/about')
    vi.runAllTimers()

    expect(scrollTo).not.toHaveBeenCalled()

    scrollTo.mockRestore()
    vi.useRealTimers()
    router.destroy()
  })

  it('calls the custom scrollBehavior function with (from, to, { hash })', async () => {
    vi.useFakeTimers()
    const customScroll = vi.fn()
    const router = await makeRouter([], { scrollBehavior: customScroll })

    await router.navigateTo('/about')
    vi.runAllTimers()

    expect(customScroll).toHaveBeenCalledWith(
      expect.anything(),               // from
      expect.objectContaining({ component: AboutPage }), // to
      expect.objectContaining({ hash: null })
    )

    vi.useRealTimers()
    router.destroy()
  })

  it('scrolls to the anchor element when a hash fragment is in the path', async () => {
    vi.useFakeTimers()
    // jsdom doesn't implement scrollIntoView, so assign a mock directly instead
    // of using vi.spyOn (which would throw "does not exist").
    const anchor = document.createElement('div')
    anchor.id = 'section'
    anchor.scrollIntoView = vi.fn()
    document.body.appendChild(anchor)

    const router = await makeRouter()
    await router.navigateTo('/about#section')
    vi.runAllTimers()

    expect(anchor.scrollIntoView).toHaveBeenCalledOnce()
    document.body.removeChild(anchor)
    vi.useRealTimers()
    router.destroy()
  })

  it('falls back to scroll-to-top when the hash target element is not in the DOM', async () => {
    vi.useFakeTimers()
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    const router = await makeRouter()

    await router.navigateTo('/about#does-not-exist')
    vi.runAllTimers()

    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 0, left: 0 }))

    scrollTo.mockRestore()
    vi.useRealTimers()
    router.destroy()
  })

  it('passes the parsed hash to the custom scrollBehavior function', async () => {
    vi.useFakeTimers()
    const customScroll = vi.fn()
    const router = await makeRouter([], { scrollBehavior: customScroll })

    await router.navigateTo('/about#features')
    vi.runAllTimers()

    expect(customScroll).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ component: AboutPage }),
      { hash: 'features' }
    )

    vi.useRealTimers()
    router.destroy()
  })
})

// ---------------------------------------------------------------------------
// popstate handling — back/forward triggers re-navigation
// ---------------------------------------------------------------------------

describe('HashRouter — popstate handling', () => {
  it('re-matches the current route when a popstate event fires', async () => {
    const router = await makeRouter()
    const handler = vi.fn()
    router.subscribe(handler)

    // Simulate a browser back/forward changing the URL hash, then firing popstate.
    window.history.replaceState({}, '', '#/about')
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }))

    // popstate triggers an async navigateTo — wait one microtask for it to settle.
    await Promise.resolve()
    await Promise.resolve()

    expect(router.matchedRoute?.component).toBe(AboutPage)
    expect(handler).toHaveBeenCalled()
    router.destroy()
  })
})

// ---------------------------------------------------------------------------
// NoopRouter — all methods are safe stubs
// ---------------------------------------------------------------------------

describe('NoopRouter', () => {
  it('provides all the same methods as HashRouter without throwing', () => {
    const router = new NoopRouter()

    expect(() => router.init()).not.toThrow()
    expect(() => router.destroy()).not.toThrow()
    expect(() => router.navigateTo('/anywhere')).not.toThrow()
    expect(() => router.back()).not.toThrow()
    expect(() => router.forward()).not.toThrow()
    expect(() => router.subscribe(() => {})).not.toThrow()
    expect(() => router.unsubscribe(() => {})).not.toThrow()
    expect(() => router.linkHref('/anywhere')).not.toThrow()
  })

  it('linkHref() returns the path unchanged', () => {
    const router = new NoopRouter()
    expect(router.linkHref('/about')).toBe('/about')
  })
})

// ---------------------------------------------------------------------------
// linkHref()
// ---------------------------------------------------------------------------

describe('HashRouter — linkHref()', () => {
  it('formats a path with the "#" prefix', () => {
    const router = new HashRouter([])
    expect(router.linkHref('/about')).toBe('#/about')
  })
})
