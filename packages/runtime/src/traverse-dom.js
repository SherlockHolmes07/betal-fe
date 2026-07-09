/**
 * Generic DFS walk over a vdom tree: visits a node, then recurses
 * into its children, in order. Two hooks make it reusable rather than
 * single-purpose:
 *
 *  - `processNode(node, parentNode, index)` runs on every visited node,
 *    with enough context (its parent and position) to mutate the parent's
 *    children in place, which replaces SLOT nodes
 *    in-flight via `parent.children.splice(index, ...)`.
 *  - `shouldSkipBranch(node)` can prune a whole subtree: when it returns
 *    true, that node is neither processed nor recursed into. This is the
 *    mechanism slots.js uses to stop at nested COMPONENT boundaries, so a
 *    child component's own SLOT nodes aren't touched by its parent's walk.
 *
 * @param {Object} vdom - The vdom node to visit (recursion starts here).
 * @param {(node: Object, parentNode: Object|null, index: number|null) => void} processNode - Called on every non-skipped node.
 * @param {(node: Object) => boolean} [shouldSkipBranch] - Return true to skip a node and everything under it. Defaults to never skipping.
 * @param {Object|null} [parentNode] - Internal: the current node's parent, threaded through recursive calls.
 * @param {number|null} [index] - Internal: the current node's index within `parentNode.children`.
 * @returns {void}
 */
export function traverseDFS(
  vdom,
  processNode,
  shouldSkipBranch = () => false,
  parentNode = null,
  index = null
) {
  if (shouldSkipBranch(vdom)) return;

  processNode(vdom, parentNode, index);

  if (vdom.children) {
    vdom.children.forEach((child, i) =>
      traverseDFS(child, processNode, shouldSkipBranch, vdom, i)
    );
  }
}
