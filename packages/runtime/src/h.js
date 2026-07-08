import { filterNulls } from "./utils/arrays.js";

/**
 * DOM node types.
 * @enum {string}
 */
export const DOM_TYPES = {
  TEXT: "text",
  ELEMENT: "element",
  FRAGMENT: "fragment",
  COMPONENT: "component",
  SLOT: "slot",
};

let hSlotCalled = false;

/**
 * Create a virtual DOM node for an element or component.
 *
 * @param {string|Function} tag - HTML tag name (e.g., 'div') for elements, or component constructor for components.
 * @param {Object} [props={}] - Properties, attributes, and event handlers for the node.
 * @param {Array} [children=[]] - Child nodes or text content.
 * @returns {Object} Virtual DOM node object.
 */
export function h(tag, props = {}, children = []) {
  const type =
    typeof tag === "string" ? DOM_TYPES.ELEMENT : DOM_TYPES.COMPONENT;
  return {
    type,
    tag,
    props,
    children: convertTextNodes(filterNulls(children)),
  };
}

/**
 * Convert string nodes to text VNodes while preserving existing VNode objects.
 *
 * @param {Array<string|Object>} nodes - Array of strings or virtual DOM nodes.
 * @returns {Array<Object>} Array of virtual DOM text nodes and preserved VNodes.
 * @private
 */
function convertTextNodes(nodes) {
  return nodes.map((node) => (typeof node === "string" ? hString(node) : node));
}

/**
 * Create a virtual DOM text node.
 *
 * @param {string} str - Text content for the node.
 * @returns {Object} Virtual DOM text node object.
 */
export function hString(str) {
  return { type: DOM_TYPES.TEXT, value: str };
}

/**
 * Create a virtual DOM fragment node for rendering multiple sibling nodes.
 *
 * @param {Array<string|Object>} vNodes - Child nodes or text content to render as siblings.
 * @returns {Object} Virtual DOM fragment node object.
 */
export function hFragment(vNodes) {
  return {
    type: DOM_TYPES.FRAGMENT,
    children: convertTextNodes(filterNulls(vNodes)),
  };
}

/**
 * Check if a slot was created during the last render.
 *
 * @returns {boolean} True if hSlot() was called during rendering, false otherwise.
 */
export function didCreateSlot() {
  return hSlotCalled;
}

/**
 * Reset the slot creation flag after processing.
 *
 * @returns {void}
 */
export function resetDidCreateSlot() {
  hSlotCalled = false;
}

/**
 * Create a virtual DOM slot node for component content projection.
 *
 * @param {Array<string|Object>} [children=[]] - Default child nodes to render in the slot.
 * @returns {Object} Virtual DOM slot node object.
 */
export function hSlot(children = []) {
  hSlotCalled = true;
  return { type: DOM_TYPES.SLOT, children };
}

/**
 * Recursively extract all non-fragment child nodes from a virtual DOM tree.
 *
 * Flattens nested fragments to get a flat list of actual renderable nodes.
 *
 * @param {Object} vdom - Virtual DOM node to extract children from.
 * @returns {Array<Object>} Flat array of non-fragment virtual DOM nodes.
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
