import { describe, it, expect, vi } from 'vitest'
import { traverseDFS } from '../traverse-dom.js'
import { h, hFragment, DOM_TYPES } from '../h.js'

// ---------------------------------------------------------------------------
// traverseDFS
//
// Depth-first traversal that visits every node in a vnode tree, calling
// processNode(node, parent, index) for each one. Branches can be skipped.
// ---------------------------------------------------------------------------

describe('traverseDFS', () => {
  it('calls processNode for the root node with parent=null and index=null', () => {
    const root = h('div')
    const processNode = vi.fn()

    traverseDFS(root, processNode)

    expect(processNode).toHaveBeenCalledWith(root, null, null)
  })

  it('visits children in order, passing the parent vnode and their index', () => {
    const child0 = h('span')
    const child1 = h('em')
    const root = h('div', {}, [child0, child1])

    const calls = []
    traverseDFS(root, (node, parent, index) => calls.push({ node, parent, index }))

    // root is visited first (pre-order), then children in order
    expect(calls[0].node).toBe(root)
    expect(calls[1]).toMatchObject({ node: child0, parent: root, index: 0 })
    expect(calls[2]).toMatchObject({ node: child1, parent: root, index: 1 })
  })

  it('recurses into nested children', () => {
    const grandchild = h('strong')
    const child = h('p', {}, [grandchild])
    const root = h('div', {}, [child])

    const visited = []
    traverseDFS(root, (node) => visited.push(node))

    expect(visited).toContain(grandchild)
  })

  it('visits nodes inside a fragment', () => {
    const leaf = h('span')
    const frag = hFragment([leaf])
    const processNode = vi.fn()

    traverseDFS(frag, processNode)

    const visitedNodes = processNode.mock.calls.map((call) => call[0])
    expect(visitedNodes).toContain(leaf)
  })

  it('skips a branch entirely when shouldSkipBranch returns true for that node', () => {
    const skipped = h('section')
    const sibling = h('aside')
    const root = h('div', {}, [skipped, sibling])

    const visited = []
    traverseDFS(
      root,
      (node) => visited.push(node),
      (node) => node === skipped // skip the 'section' subtree
    )

    expect(visited).not.toContain(skipped)
    expect(visited).toContain(sibling)
  })

  it('skips the descendants of a skipped branch', () => {
    const deepChild = h('b')
    const skippedBranch = h('section', {}, [deepChild])
    const root = h('div', {}, [skippedBranch])

    const visited = []
    traverseDFS(
      root,
      (node) => visited.push(node),
      (node) => node === skippedBranch
    )

    expect(visited).not.toContain(deepChild)
  })

  it('handles a leaf node (no children) without throwing', () => {
    const leaf = h('img')
    const processNode = vi.fn()

    expect(() => traverseDFS(leaf, processNode)).not.toThrow()
    expect(processNode).toHaveBeenCalledOnce()
  })

  it('defaults shouldSkipBranch to never skip when not provided', () => {
    const child = h('span')
    const root = h('div', {}, [child])

    const visited = []
    traverseDFS(root, (node) => visited.push(node))

    expect(visited).toContain(child)
  })
})
