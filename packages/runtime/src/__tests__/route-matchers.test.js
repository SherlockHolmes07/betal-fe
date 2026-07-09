import { describe, it, expect } from 'vitest'
import { makeRouteMatcher } from '../route-matchers.js'

// ---------------------------------------------------------------------------
// makeRouteMatcher — static routes (no :params)
// ---------------------------------------------------------------------------

describe('makeRouteMatcher — static routes', () => {
  it('matches an exact static path', () => {
    const matcher = makeRouteMatcher({ path: '/about' })
    expect(matcher.checkMatch('/about')).toBe(true)
  })

  it('does not match a different path', () => {
    const matcher = makeRouteMatcher({ path: '/about' })
    expect(matcher.checkMatch('/contact')).toBe(false)
  })

  it('does not match a path that only starts with the route (no partial matches)', () => {
    const matcher = makeRouteMatcher({ path: '/about' })
    expect(matcher.checkMatch('/about/team')).toBe(false)
  })

  it('returns an empty params object for static routes (no dynamic segments)', () => {
    const matcher = makeRouteMatcher({ path: '/home' })
    expect(matcher.extractParams('/home')).toEqual({})
  })

  it('stores the original route definition on the matcher', () => {
    const route = { path: '/home', component: () => {} }
    const matcher = makeRouteMatcher(route)
    expect(matcher.route).toBe(route)
  })

  it('marks the matcher as a redirect when the route has a redirect property', () => {
    const matcher = makeRouteMatcher({ path: '/old', redirect: '/new' })
    expect(matcher.isRedirect).toBe(true)
  })

  it('does not mark the matcher as a redirect for a normal component route', () => {
    const matcher = makeRouteMatcher({ path: '/home', component: () => {} })
    expect(matcher.isRedirect).toBe(false)
  })

  it('still matches when the path has a trailing query string', () => {
    const matcher = makeRouteMatcher({ path: '/about' })
    expect(matcher.checkMatch('/about?ref=newsletter')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// makeRouteMatcher — catch-all "*"
// ---------------------------------------------------------------------------

describe('makeRouteMatcher — catch-all route "*"', () => {
  it('matches any path', () => {
    const matcher = makeRouteMatcher({ path: '*' })
    expect(matcher.checkMatch('/anything')).toBe(true)
    expect(matcher.checkMatch('/deeply/nested/path')).toBe(true)
    expect(matcher.checkMatch('/')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// makeRouteMatcher — dynamic param routes
// ---------------------------------------------------------------------------

describe('makeRouteMatcher — routes with dynamic params', () => {
  it('matches a path with a single param segment', () => {
    const matcher = makeRouteMatcher({ path: '/user/:id' })
    expect(matcher.checkMatch('/user/42')).toBe(true)
  })

  it('does not match when the required param segment is absent', () => {
    const matcher = makeRouteMatcher({ path: '/user/:id' })
    expect(matcher.checkMatch('/user')).toBe(false)
  })

  it('extracts a single param from the URL', () => {
    const matcher = makeRouteMatcher({ path: '/user/:id' })
    const params = matcher.extractParams('/user/42')
    expect(params.id).toBe('42')
  })

  it('extracts multiple params from a multi-segment URL', () => {
    const matcher = makeRouteMatcher({ path: '/user/:userId/post/:postId' })
    const params = matcher.extractParams('/user/5/post/99')
    expect(params.userId).toBe('5')
    expect(params.postId).toBe('99')
  })

  it('does not match a path with an extra trailing segment', () => {
    const matcher = makeRouteMatcher({ path: '/user/:id' })
    expect(matcher.checkMatch('/user/42/extra')).toBe(false)
  })

  it('still matches when the path has a trailing query string', () => {
    const matcher = makeRouteMatcher({ path: '/user/:id' })
    expect(matcher.checkMatch('/user/42?tab=profile')).toBe(true)
  })

  it('does not let a trailing query string leak into the extracted param value', () => {
    const matcher = makeRouteMatcher({ path: '/user/:id' })
    const params = matcher.extractParams('/user/42?tab=profile')
    expect(params.id).toBe('42')
  })
})

// ---------------------------------------------------------------------------
// extractQuery — shared by all matcher types
// ---------------------------------------------------------------------------

describe('extractQuery', () => {
  it('returns an empty object when there is no query string', () => {
    const matcher = makeRouteMatcher({ path: '/search' })
    expect(matcher.extractQuery('/search')).toEqual({})
  })

  it('parses a single key-value query param', () => {
    const matcher = makeRouteMatcher({ path: '/search' })
    expect(matcher.extractQuery('/search?q=hello')).toEqual({ q: 'hello' })
  })

  it('parses multiple query params', () => {
    const matcher = makeRouteMatcher({ path: '/items' })
    const query = matcher.extractQuery('/items?page=2&limit=10')
    expect(query).toEqual({ page: '2', limit: '10' })
  })

  it('also extracts the query string from a parameterised route path', () => {
    const matcher = makeRouteMatcher({ path: '/user/:id' })
    const query = matcher.extractQuery('/user/5?tab=profile')
    expect(query).toEqual({ tab: 'profile' })
  })
})
