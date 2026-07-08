import { DOM_TYPES } from "./h.js";

/**
 * Convert string nodes to text VNodes while preserving existing VNode objects.
 *
 * @param {Array<string|Object>} nodes - Array of strings or virtual DOM nodes.
 * @returns {Array<Object>} Array of virtual DOM text nodes and preserved VNodes.
 */
export function convertTextNodes(nodes) {
  return nodes.map((node) => {
    if (typeof node === "string") {
      return { type: DOM_TYPES.TEXT, value: node };
    }
    return node;
  });
}

/**
 * Recursively extract all non-fragment child nodes from a virtual DOM tree.
 *
 * Flattens nested fragments to get a flat list of actual renderable nodes.
 *
 * @param {Object} vdom - Virtual DOM node to extract children from.
 * @returns {Array<Object>} Flat array of non-fragment virtual DOM nodes.
 */
export function extractChildNodesNodes(vdom) {
  if (vdom.children == null) {
    return [];
  }
  const children = [];
  for (const child of vdom.children) {
    if (child.type === DOM_TYPES.FRAGMENT) {
      children.push(...extractChildNodesNodes(child));
    } else {
      children.push(child);
    }
  }
  return children;
}
