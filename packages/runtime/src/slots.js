import { DOM_TYPES, hFragment } from "./h.js";
import { traverseDFS } from "./traverse-dom.js";

/**
 * Whether `vdom` contains a slot this component needs to fill — either
 * `vdom` itself, or one reachable through its elements/fragments.
 * @param {Object} vdom - The vdom node to check (and recurse into).
 * @returns {boolean} True if a slot belonging to this component exists anywhere in `vdom`.
 */
export function containsSlot(vdom) {
  if (vdom.type === DOM_TYPES.SLOT) return true;
  if (vdom.type === DOM_TYPES.COMPONENT) return false;

  return (vdom.children ?? []).some(containsSlot);
}

/**
 * Walks a just-rendered vdom tree and replaces every `SLOT` node in it with
 * `externalContent` — the children the parent passed to this component.
 *
 * @param {Object} vdom - The vdom tree to fill slots in, mutated in place.
 * @param {Array|Object.<string, Array>} [externalContent=[]] - The children this component was given by its parent.
 * @returns {void}
 */
export function fillSlots(vdom, externalContent = []) {
  const externalContentByName = normalizeExternalContent(externalContent);
  const filledNames = new Set();

  function processNode(node, parent, index) {
    insertViewInSlot(node, parent, index, externalContentByName, filledNames);
  }

  traverseDFS(vdom, processNode, shouldSkipBranch);
  warnAboutUnknownSlotNames(externalContentByName, filledNames);
}

function normalizeExternalContent(externalContent) {
  return Array.isArray(externalContent) ? { default: externalContent } : externalContent;
}

function insertViewInSlot(node, parent, index, externalContentByName, filledNames) {
  if (node.type !== DOM_TYPES.SLOT) return;

  filledNames.add(node.name);
  // If the parent passed content for this slot, use it; otherwise,
  // use the slot's default content (if any).
  // If neither exists, remove the slot node entirely.
  const externalViews = externalContentByName[node.name] ?? [];
  const defaultContent = node.children;
  const views = externalViews.length > 0 ? externalViews : defaultContent;

  const hasContent = views.length > 0;
  if (hasContent) {
    parent.children.splice(index, 1, hFragment(views));
  } else {
    parent.children.splice(index, 1);
  }
}

// Catches a typo'd slot name: content the parent clearly meant for a named
// slot that no hSlot() in this render ever declared, silently dropped
// otherwise.
function warnAboutUnknownSlotNames(externalContentByName, filledNames) {
  for (const [name, content] of Object.entries(externalContentByName)) {
    // An empty array means the parent supplied nothing for this name — most
    // often just the synthetic 'default' key from normalizing `[]`/no
    // external content at all, not an actual mismatched slot name.
    if (content.length > 0 && !filledNames.has(name)) {
      console.warn(`[Slots] No slot named "${name}" was found to fill`);
    }
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
