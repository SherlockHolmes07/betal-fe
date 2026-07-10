import { describe, it, expect, vi, afterEach } from 'vitest'
import { fillSlots, containsSlot } from '../slots.js'
import { h, hFragment, hSlot, DOM_TYPES } from '../h.js'

// fillSlots mutates the vdom tree in-place, replacing SLOT nodes with a
// hFragment wrapping the chosen content (external or default).

describe('fillSlots', () => {
  it('replaces a slot with external content provided by the parent', () => {
    const externalParagraph = h('p', {}, ['External content'])
    const template = h('div', {}, [hSlot()])

    fillSlots(template, [externalParagraph])

    // The slot node should have been replaced with a fragment containing the external content
    expect(template.children[0].type).toBe(DOM_TYPES.FRAGMENT)
    expect(template.children[0].children[0]).toBe(externalParagraph)
  })

  it('falls back to the slot default content when no external content is provided', () => {
    const defaultP = h('p', {}, ['Default'])
    const template = h('div', {}, [hSlot([defaultP])])

    fillSlots(template, [])

    expect(template.children[0].type).toBe(DOM_TYPES.FRAGMENT)
    expect(template.children[0].children[0]).toBe(defaultP)
  })

  it('removes the slot entirely when there is neither external nor default content', () => {
    const template = h('div', {}, [hSlot()])

    fillSlots(template, [])

    // The slot is spliced out — the parent should have no children
    expect(template.children).toHaveLength(0)
  })

  it('prefers external content over default content when both exist', () => {
    const external = h('span', {}, ['external'])
    const defaultContent = h('span', {}, ['default'])
    const template = h('div', {}, [hSlot([defaultContent])])

    fillSlots(template, [external])

    const filledSlot = template.children[0]
    expect(filledSlot.children[0]).toBe(external)
    expect(filledSlot.children[0]).not.toBe(defaultContent)
  })

  it('does not descend into child component subtrees (they fill their own slots)', () => {
    // A component vnode's children should not be traversed
    const ComponentA = () => {}
    const slotInsideComponent = hSlot([h('p', {}, ['nested default'])])
    const componentVnode = h(ComponentA, {}, [slotInsideComponent])
    const template = h('div', {}, [componentVnode])

    // External content provided at the outer level
    fillSlots(template, [h('span')])

    // The slot inside ComponentA should NOT have been replaced
    expect(componentVnode.children[0].type).toBe(DOM_TYPES.SLOT)
  })

  it('handles a template with no slot nodes without throwing', () => {
    const template = h('div', {}, [h('p', {}, ['no slot here'])])

    expect(() => fillSlots(template, [h('extra')])).not.toThrow()
    expect(template.children[0].tag).toBe('p')
  })

  it('handles an empty vdom tree without throwing', () => {
    const template = h('div')
    expect(() => fillSlots(template, [])).not.toThrow()
  })

  it('routes each named slot to its matching external content, given as an object', () => {
    const header = h('h2', {}, ['Title'])
    const footer = h('button', {}, ['OK'])
    const template = h('div', {}, [hSlot('header'), hSlot('footer')])

    fillSlots(template, { header: [header], footer: [footer] })

    expect(template.children[0].children[0]).toBe(header)
    expect(template.children[1].children[0]).toBe(footer)
  })

  it('mixes the default slot with named slots in one external-content object', () => {
    const body = h('p', {}, ['Body'])
    const footer = h('button', {}, ['OK'])
    const template = h('div', {}, [hSlot(), hSlot('footer')])

    fillSlots(template, { default: [body], footer: [footer] })

    expect(template.children[0].children[0]).toBe(body)
    expect(template.children[1].children[0]).toBe(footer)
  })

  it('falls back to a named slot\'s own default content when the parent supplies nothing for it', () => {
    const fallback = h('h2', {}, ['Fallback title'])
    const template = h('div', {}, [hSlot('header', [fallback])])

    fillSlots(template, { footer: [h('button')] })

    expect(template.children[0].children[0]).toBe(fallback)
  })

  describe('unknown slot name warning', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('warns when external content is given for a slot name the template never declares', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const template = h('div', {}, [hSlot('header')])

      fillSlots(template, { header: [h('h2')], typo: [h('p')] })

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('typo'))
    })

    it('does not warn when every supplied slot name matches a declared slot', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const template = h('div', {}, [hSlot('header')])

      fillSlots(template, { header: [h('h2')] })

      expect(warn).not.toHaveBeenCalled()
    })
  })
})

// ---------------------------------------------------------------------------
// containsSlot
// ---------------------------------------------------------------------------

describe('containsSlot', () => {
  it('returns true when the vdom itself is a slot node', () => {
    expect(containsSlot(hSlot())).toBe(true)
  })

  it('returns true when a slot is nested inside elements/fragments', () => {
    const template = h('div', {}, [hFragment([h('p', {}, [hSlot()])])])
    expect(containsSlot(template)).toBe(true)
  })

  it('returns false when there is no slot anywhere in the tree', () => {
    const template = h('div', {}, [h('p', {}, ['just text'])])
    expect(containsSlot(template)).toBe(false)
  })

  it('returns false for a slot nested inside a child component (not this component\'s own slot)', () => {
    const ComponentA = () => {}
    const componentVnode = h(ComponentA, {}, [hSlot()])
    const template = h('div', {}, [componentVnode])

    expect(containsSlot(template)).toBe(false)
  })
})
