import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { hashHistoryStrategy, browserHistoryStrategy } from '../history-strategies.js'

beforeEach(() => {
  window.history.replaceState({}, '', '/')
})

// ---------------------------------------------------------------------------
// hashHistoryStrategy
// ---------------------------------------------------------------------------

describe('hashHistoryStrategy', () => {
  describe('getCurrentPath', () => {
    it('returns "/" when the hash is empty', () => {
      window.history.replaceState({}, '', '/')
      expect(hashHistoryStrategy.getCurrentPath()).toBe('/')
    })

    it('strips the leading "#" from the hash', () => {
      window.history.replaceState({}, '', '#/about')
      expect(hashHistoryStrategy.getCurrentPath()).toBe('/about')
    })

    it('includes a query string embedded in the hash', () => {
      window.history.replaceState({}, '', '#/user/5?tab=profile')
      expect(hashHistoryStrategy.getCurrentPath()).toBe('/user/5?tab=profile')
    })
  })

  describe('pushPath', () => {
    it('writes the path as a "#"-prefixed hash', () => {
      const pushState = vi.spyOn(window.history, 'pushState')
      hashHistoryStrategy.pushPath('/about')

      expect(pushState).toHaveBeenCalledWith({}, '', '#/about')
      pushState.mockRestore()
    })
  })

  describe('normalizeInitialUrl', () => {
    it('sets the hash to "#/" when it is empty', () => {
      window.history.replaceState({}, '', location.pathname) // clear hash
      hashHistoryStrategy.normalizeInitialUrl()

      expect(location.hash).toBe('#/')
    })

    it('leaves an existing hash untouched', () => {
      window.history.replaceState({}, '', '#/about')
      const replaceState = vi.spyOn(window.history, 'replaceState')

      hashHistoryStrategy.normalizeInitialUrl()

      expect(replaceState).not.toHaveBeenCalled()
      replaceState.mockRestore()
    })
  })

  describe('linkHref', () => {
    it('prefixes the path with "#"', () => {
      expect(hashHistoryStrategy.linkHref('/about')).toBe('#/about')
    })
  })
})

// ---------------------------------------------------------------------------
// browserHistoryStrategy
// ---------------------------------------------------------------------------

describe('browserHistoryStrategy', () => {
  afterEach(() => {
    window.history.replaceState({}, '', '/')
  })

  describe('getCurrentPath', () => {
    it('returns "/" at the root', () => {
      window.history.replaceState({}, '', '/')
      expect(browserHistoryStrategy.getCurrentPath()).toBe('/')
    })

    it('returns the pathname for a nested route', () => {
      window.history.replaceState({}, '', '/about')
      expect(browserHistoryStrategy.getCurrentPath()).toBe('/about')
    })

    it('includes the query string', () => {
      window.history.replaceState({}, '', '/user/5?tab=profile')
      expect(browserHistoryStrategy.getCurrentPath()).toBe('/user/5?tab=profile')
    })

    it('includes an in-page anchor fragment', () => {
      window.history.replaceState({}, '', '/docs?x=1#install')
      expect(browserHistoryStrategy.getCurrentPath()).toBe('/docs?x=1#install')
    })
  })

  describe('pushPath', () => {
    it('writes the path with no "#" prefix', () => {
      const pushState = vi.spyOn(window.history, 'pushState')
      browserHistoryStrategy.pushPath('/about')

      expect(pushState).toHaveBeenCalledWith({}, '', '/about')
      pushState.mockRestore()
    })
  })

  describe('normalizeInitialUrl', () => {
    it('does not touch the URL — pathname is never actually empty', () => {
      const replaceState = vi.spyOn(window.history, 'replaceState')
      const pushState = vi.spyOn(window.history, 'pushState')

      browserHistoryStrategy.normalizeInitialUrl()

      expect(replaceState).not.toHaveBeenCalled()
      expect(pushState).not.toHaveBeenCalled()
      replaceState.mockRestore()
      pushState.mockRestore()
    })
  })

  describe('linkHref', () => {
    it('returns the path unchanged', () => {
      expect(browserHistoryStrategy.linkHref('/about')).toBe('/about')
    })
  })
})
