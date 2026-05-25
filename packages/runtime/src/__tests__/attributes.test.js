import { describe, it, expect, beforeEach } from 'vitest'
import {
  setAttributes,
  setAttribute,
  removeAttribute,
  setStyle,
  removeStyle,
} from '../attributes.js'

// Each test gets a fresh element so mutations don't bleed between cases.
let el

beforeEach(() => {
  el = document.createElement('div')
})

// ---------------------------------------------------------------------------
// setStyle / removeStyle
// ---------------------------------------------------------------------------

describe('setStyle', () => {
  it('sets a CSS property on the element style object', () => {
    setStyle(el, 'color', 'red')
    expect(el.style.color).toBe('red')
  })

  it('overwrites an already-set style property', () => {
    setStyle(el, 'color', 'red')
    setStyle(el, 'color', 'blue')
    expect(el.style.color).toBe('blue')
  })
})

describe('removeStyle', () => {
  it('clears a previously set style property by setting it to null', () => {
    setStyle(el, 'color', 'red')
    removeStyle(el, 'color')
    expect(el.style.color).toBe('')
  })
})

// ---------------------------------------------------------------------------
// setAttribute / removeAttribute
// ---------------------------------------------------------------------------

describe('setAttribute', () => {
  it('sets a property directly on the element for standard attributes', () => {
    setAttribute(el, 'id', 'my-id')
    expect(el.id).toBe('my-id')
  })

  it('uses setAttribute() for data-* attributes so they appear in the HTML', () => {
    setAttribute(el, 'data-testid', 'btn')
    expect(el.getAttribute('data-testid')).toBe('btn')
  })

  it('calls removeAttribute when the value is null', () => {
    el.id = 'old-id'
    setAttribute(el, 'id', null)
    expect(el.id).toBe('')
  })

  it('calls removeAttribute when the value is undefined', () => {
    el.id = 'old-id'
    setAttribute(el, 'id', undefined)
    expect(el.id).toBe('')
  })
})

describe('removeAttribute', () => {
  it('nulls out the JS property AND removes the HTML attribute', () => {
    el.setAttribute('tabindex', '0')
    removeAttribute(el, 'tabindex')

    expect(el.getAttribute('tabindex')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// setAttributes — the high-level entry point used by mountDOM
// ---------------------------------------------------------------------------

describe('setAttributes', () => {
  describe('class handling', () => {
    it('sets className from a plain string', () => {
      setAttributes(el, { class: 'foo bar' })
      expect(el.className).toBe('foo bar')
    })

    it('adds all classes from an array of strings', () => {
      setAttributes(el, { class: ['foo', 'bar'] })
      expect(el.classList.contains('foo')).toBe(true)
      expect(el.classList.contains('bar')).toBe(true)
    })

    it('does not set class when the class prop is absent', () => {
      setAttributes(el, { id: 'x' })
      expect(el.className).toBe('')
    })
  })

  describe('style handling', () => {
    it('applies each style property from the style object', () => {
      setAttributes(el, { style: { color: 'red', fontSize: '16px' } })
      expect(el.style.color).toBe('red')
      expect(el.style.fontSize).toBe('16px')
    })

    it('does not throw when no style prop is provided', () => {
      expect(() => setAttributes(el, {})).not.toThrow()
    })
  })

  describe('other attributes', () => {
    it('sets arbitrary attributes as direct JS properties', () => {
      setAttributes(el, { id: 'my-id', tabIndex: 3 })
      expect(el.id).toBe('my-id')
      expect(el.tabIndex).toBe(3)
    })

    it('handles class, style, and other attributes all at once', () => {
      setAttributes(el, {
        class: 'active',
        style: { color: 'green' },
        id: 'combo',
      })
      expect(el.className).toBe('active')
      expect(el.style.color).toBe('green')
      expect(el.id).toBe('combo')
    })
  })
})
