import { DOM_TYPES } from './h.js';

/**
 * Recursively extracts all non-fragment children of a vdom node, flattening
 * any nested FRAGMENT nodes so reconciliation sees a flat list of actually
 * renderable nodes instead of fragment wrapper boundaries. Used by
 * patch-dom.js's child-list diffing and by a component's `elements` getter.
 *
 * @param {Object} vdom - The vdom node whose children to extract.
 * @returns {Array<Object>} Flat array of non-fragment child vnodes.
 */
export function extractChildNodes(vdom) {
  if (vdom.children == null) {
    return [];
  }
  const children = [];
  for (const child of vdom.children) {
    if (child.type === DOM_TYPES.FRAGMENT) {
      children.push(...extractChildNodes(child));
    } else {
      children.push(child);
    }
  }
  return children;
}
