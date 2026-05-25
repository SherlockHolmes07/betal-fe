import { describe, it, expect } from 'vitest'
import { extractPropsAndEvents } from '../../utils/props.js'

// Helpers to build a minimal vnode shape that extractPropsAndEvents expects.
const vnode = (props) => ({ props })

describe('extractPropsAndEvents', () => {
  it('separates the "on" map into events and leaves everything else as props', () => {
    const handler = () => {}
    const { props, events } = extractPropsAndEvents(
      vnode({ class: 'btn', on: { click: handler } })
    )

    expect(props).toEqual({ class: 'btn' })
    expect(events).toEqual({ click: handler })
  })

  it('returns an empty events object when the vnode has no "on" prop', () => {
    const { events } = extractPropsAndEvents(vnode({ class: 'btn' }))

    expect(events).toEqual({})
  })

  it('strips the "key" prop so it is never set as a real DOM attribute', () => {
    const { props } = extractPropsAndEvents(vnode({ key: 'item-1', id: 'foo' }))

    expect(props).not.toHaveProperty('key')
    expect(props).toHaveProperty('id', 'foo')
  })

  it('returns empty props and empty events for an empty props object', () => {
    const { props, events } = extractPropsAndEvents(vnode({}))

    expect(props).toEqual({})
    expect(events).toEqual({})
  })

  it('does not mutate the original vnode props object', () => {
    const original = { key: 'k', class: 'x', on: { click: () => {} } }
    extractPropsAndEvents(vnode(original))

    // The original object passed in should still have all its keys.
    expect(original).toHaveProperty('key')
    expect(original).toHaveProperty('on')
  })
})
