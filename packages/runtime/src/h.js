import { filterNulls } from "./utils/arrays.js";
import { assert } from "./utils/assert.js";

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

/**
 * Converts raw string children into TEXT vnodes, leaving already-built
 * vnodes untouched. Used by `h()` and `hFragment()` to normalize whatever
 * children array a caller passed in.
 *
 * @param {Array<string|Object>} nodes - Children as authored — raw strings or vnodes.
 * @returns {Array<Object>} The same nodes, with every string wrapped as a TEXT vnode.
 */
function convertTextNodes(nodes) {
  return nodes.map((node) => (typeof node === "string" ? hString(node) : node));
}


/**
 * Normalizes a vnode's `children` as authored by `h()`'s caller: either a
 * plain array or for a plain object mapping slot name to that slot's array
 * of children, so a parent can target several of a component's named slots
 * at once.
 */
function normalizeChildren(children) {
  if (Array.isArray(children)) {
    return convertTextNodes(filterNulls(children));
  }

  return Object.fromEntries(
    Object.entries(children).map(([name, vnodes]) => [name, convertTextNodes(filterNulls(vnodes))])
  );
}

/**
 * Create a virtual DOM node for an element or component.
 *
 * @param {string|Function} tag - HTML tag name (e.g., 'div') for elements, or component constructor for components.
 * @param {Object} [props={}] - Properties, attributes, and event handlers for the node.
 * @param {Array|Object} [children=[]] - Child nodes or text content. For components only, this may instead be a plain object mapping named-slot name to that slot's children array (see `hSlot`).
 * @returns {Object} Virtual DOM node object.
 */
export function h(tag, props = {}, children = []) {
  const type =
    typeof tag === "string" ? DOM_TYPES.ELEMENT : DOM_TYPES.COMPONENT;

  assert(
    type === DOM_TYPES.COMPONENT || Array.isArray(children),
    "Element children must be an array — named-slot objects are only valid for component children"
  );

  return {
    type,
    tag,
    props,
    children: normalizeChildren(children),
  };
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
 * Create a virtual DOM slot node for component content projection.
 *
 * @param {string|Array<string|Object>} [nameOrChildren='default'] - Either the slot's name, or — for the common single-slot case,
 * slot's default content, which implicitly names it `'default'`.
 * @param {Array<string|Object>} [children=[]] - Default child nodes to render in the slot, when a name was given as the first argument.
 * @returns {Object} Virtual DOM slot node object.
 */
export function hSlot(nameOrChildren = 'default', children = []) {
  if (typeof nameOrChildren === 'string') {
    return { type: DOM_TYPES.SLOT, name: nameOrChildren, children };
  }

  // Shorthand form: hSlot([...]) — unnamed, targets the default slot.
  return { type: DOM_TYPES.SLOT, name: 'default', children: nameOrChildren };
}
