import { DOM_TYPES, hFragment } from "./h.js";
import { traverseDFS } from "./traverse-dom.js";

/**
 * Walks a just-rendered vdom tree and replaces every `SLOT` node in it with
 * `externalContent` — the children the parent passed to this component —
 * falling back to the slot's own default content when the parent passed
 * none. Called once per render, right after the user's `render()` returns
 * (see component.js), so slot content stays in sync as props change.
 *
 * There's only ever one, unnamed, default slot: every `hSlot()` in a single
 * render receives this same `externalContent` array, and a parent's
 * children replace the slot's default wholesale, never merged with it.
 *
 * @param {Object} vdom - The vdom tree to fill slots in, mutated in place.
 * @param {Array} [externalContent=[]] - The children this component was given by its parent.
 * @returns {void}
 */
export function fillSlots(vdom, externalContent = []) {
  function processNode(node, parent, index) {
    insertViewInSlot(node, parent, index, externalContent);
  }

  traverseDFS(vdom, processNode, shouldSkipBranch);
}

function insertViewInSlot(node, parent, index, externalContent) {
  if (node.type !== DOM_TYPES.SLOT) return;

  const defaultContent = node.children;
  const views = externalContent.length > 0 ? externalContent : defaultContent;

  const hasContent = views.length > 0;
  if (hasContent) {
    parent.children.splice(index, 1, hFragment(views));
  } else {
    parent.children.splice(index, 1);
  }
}

// Stops traverseDFS from descending into a nested COMPONENT's own subtree.
// Without this, a parent's fillSlots() would reach into a child component's
// SLOT nodes and fill them with the parent's own externalContent — wrong on
// two counts: those slots belong to the child, and the child hasn't even
// rendered yet at this point. Each component fills only its own slots, when
// it renders.
function shouldSkipBranch(node) {
  return node.type === DOM_TYPES.COMPONENT;
}
