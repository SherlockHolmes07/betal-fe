import { DOM_TYPES } from "./h.js";

/**
 * Check whether two virtual DOM nodes refer to the "same" node for
 * reconciliation purposes. This is NOT a deep equality check — element
 * nodes match by tag + key, component nodes match by constructor + key,
 * and other types match by type alone.
 *
 * @param {Object} nodeOne - First virtual DOM node.
 * @param {Object} nodeTwo - Second virtual DOM node.
 * @returns {boolean} True if the nodes should be treated as the same node when diffing.
 */
export function areNodesEqual(nodeOne, nodeTwo) {
  if (nodeOne.type !== nodeTwo.type) {
    return false;
  }

  if (nodeOne.type === DOM_TYPES.ELEMENT) {
    const { tag: tagOne, props: { key: keyOne } } = nodeOne;
    const { tag: tagTwo, props: { key: keyTwo } } = nodeTwo;

    return tagOne === tagTwo && keyOne === keyTwo;
  }

  if (nodeOne.type === DOM_TYPES.COMPONENT) {
    const { tag: componentOne, props: { key: keyOne } } = nodeOne;
    const { tag: componentTwo, props: { key: keyTwo } } = nodeTwo;
    return componentOne === componentTwo && keyOne === keyTwo;
  }

  return true;
}