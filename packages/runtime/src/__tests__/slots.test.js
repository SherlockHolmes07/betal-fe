import { describe, it, expect } from 'vitest'
import { fillSlots } from '../slots.js'
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
})
