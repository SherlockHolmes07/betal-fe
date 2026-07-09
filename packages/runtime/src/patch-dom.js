import { destroyDOM } from "./destroy-dom.js";
import { DOM_TYPES } from "./h.js";
import { extractChildNodes } from "./vdom-utils.js";
import { mountDOM } from "./mount-dom.js";
import { areNodesEqual } from "./nodes-equal.js";
import {
  removeAttribute,
  setAttribute,
  setStyle,
  removeStyle,
} from "./attributes.js";
import { objectsDiff } from "./utils/objects.js";
import {
  arraysDiff,
  arraysDiffSequence,
  ARRAY_DIFF_OP,
} from "./utils/arrays.js";
import { isNotBlankOrEmptyString } from "./utils/strings.js";
import { addEventListener } from "./events.js";
import { extractPropsAndEvents } from './utils/props.js';

/**
 * Reconciles a mounted vdom node with a freshly rendered one and updates
 * the real DOM to match, doing as little work as possible.
 *
 * First decides whether `oldVdom`'s DOM node can be reused at all (see
 * `areNodesEqual` — same type, and for elements/components the same
 * tag/constructor + key). If not, the old subtree is destroyed and the
 * new one is mounted fresh in its place. If it can, the existing DOM node
 * is kept and patched in place: text content, attributes/classes/styles/
 * listeners for elements, or props for components — then children are
 * reconciled recursively.
 *
 * @param {Object} oldVdom - The currently mounted virtual DOM node.
 * @param {Object} newVdom - The newly rendered virtual DOM node to reconcile against it.
 * @param {HTMLElement} parentEl - The real DOM parent both nodes live in.
 * @param {Object|null} [hostComponent=null] - The component instance that owns this subtree, if any.
 * @returns {Object} `newVdom`, now reflecting the current state of the real DOM.
 */
export function patchDOM(oldVdom, newVdom, parentEl, hostComponent = null) {
  if (!areNodesEqual(oldVdom, newVdom)) {
    return replaceWithNewNode(oldVdom, newVdom, parentEl, hostComponent);
  }

  return patchNode(oldVdom, newVdom, hostComponent);
}

function replaceWithNewNode(oldVdom, newVdom, parentEl, hostComponent) {
  const index = findIndexInParent(parentEl, oldVdom.el);
  destroyDOM(oldVdom);
  mountDOM(newVdom, parentEl, index, hostComponent);

  return newVdom;
}

function patchNode(oldVdom, newVdom, hostComponent) {
  // Reuse the existing DOM node for this vdom, and patch it in place.
  newVdom.el = oldVdom.el;

  switch (newVdom.type) {
    case DOM_TYPES.TEXT: {
      patchText(oldVdom, newVdom);
      return newVdom;
    }
    case DOM_TYPES.ELEMENT: {
      patchElement(oldVdom, newVdom, hostComponent);
      break;
    }
    case DOM_TYPES.COMPONENT: {
      patchComponent(oldVdom, newVdom);
      break;
    }
  }

  patchChildren(oldVdom, newVdom, hostComponent);

  return newVdom;
}

function findIndexInParent(parentEl, el) {
  const index = Array.from(parentEl.childNodes).indexOf(el);
  if (index < 0) {
    return null;
  }

  return index;
}

function patchText(oldVdom, newVdom) {
  const { value: oldText } = oldVdom;
  const { value: newText } = newVdom;
  if (oldText !== newText) {
    newVdom.el.nodeValue = newText;
  }
}

function patchElement(oldVdom, newVdom, hostComponent) {
  const el = oldVdom.el;

  const {
    class: oldClass,
    style: oldStyle,
    on: oldEvents,
    ...oldAttrs
  } = oldVdom.props;

  const {
    class: newClass,
    style: newStyle,
    on: newEvents,
    ...newAttrs
  } = newVdom.props;

  const { listeners: oldListeners } = oldVdom;

  patchAttrs(el, oldAttrs, newAttrs);
  patchClasses(el, oldClass, newClass);
  patchStyles(el, oldStyle, newStyle);
  newVdom.listeners = patchEvents(el, hostComponent, {
    oldListeners,
    oldEvents,
    newEvents,
  });
}

function patchAttrs(el, oldAttrs, newAttrs) {
  const { added, removed, updated } = objectsDiff(oldAttrs, newAttrs);
  for (const attr of removed) {
    removeAttribute(el, attr);
  }
  for (const attr of added.concat(updated)) {
    setAttribute(el, attr, newAttrs[attr]);
  }
}

function patchClasses(el, oldClass, newClass) {
  const oldClasses = toClassList(oldClass);
  const newClasses = toClassList(newClass);
  const { added, removed } = arraysDiff(oldClasses, newClasses);

  if (removed.length > 0) {
    el.classList.remove(...removed);
  }
  if (added.length > 0) {
    el.classList.add(...added);
  }
}

/**
 * Normalizes a vdom `class` prop — which can be authored as either an
 * array (`['foo', 'bar']`) or a space-separated string (`'foo bar'`) —
 * into a flat array of individual class names, with blank/whitespace-only
 * entries dropped (e.g. from extra spaces or a trailing space in the string).
 *
 * @param {string[]|string} [classes=""] - The `class` prop as written by the caller.
 * @returns {string[]} Individual class names, ready for `classList.add/remove`.
 */
function toClassList(classes = "") {
  return Array.isArray(classes)
    ? classes.filter(isNotBlankOrEmptyString)
    : classes.split(/\s+/).filter(isNotBlankOrEmptyString);
}

function patchStyles(el, oldStyle = {}, newStyle = {}) {
  const { added, removed, updated } = objectsDiff(oldStyle, newStyle);
  for (const style of removed) {
    removeStyle(el, style);
  }
  for (const style of added.concat(updated)) {
    setStyle(el, style, newStyle[style]);
  }
}

function patchEvents(el, hostComponent, { oldListeners = {}, oldEvents = {}, newEvents = {} }) {
  const { removed, added, updated } = objectsDiff(oldEvents, newEvents);
  const listeners = { ...oldListeners };

  for (const eventName of removed.concat(updated)) {
    el.removeEventListener(eventName, oldListeners[eventName]);
    delete listeners[eventName];
  }

  for (const eventName of added.concat(updated)) {
    const listener = addEventListener(eventName, newEvents[eventName], el, hostComponent);
    listeners[eventName] = listener;
  }

  return listeners;
}

function patchChildren(oldVdom, newVdom, hostComponent) {
  const oldChildren = extractChildNodes(oldVdom);
  const newChildren = extractChildNodes(newVdom);

  const diffSeq = arraysDiffSequence(oldChildren, newChildren, areNodesEqual);

  // The child lists, their shared parent element, and the owning component
  // are the same for every operation in this loop, so bundle them once and
  // thread the bundle through the per-operation helpers.
  const context = {
    oldChildren,
    newChildren,
    parentEl: oldVdom.el,
    hostComponent,
  };

  for (const operation of diffSeq) {
    switch (operation.op) {
      case ARRAY_DIFF_OP.ADD:
        addChild(operation, context);
        break;
      case ARRAY_DIFF_OP.REMOVE:
        removeChild(operation);
        break;
      case ARRAY_DIFF_OP.MOVE:
        moveChild(operation, context);
        break;
      case ARRAY_DIFF_OP.NOOP:
        patchChildInPlace(operation, context);
        break;
    }
  }
}

/**
 * The real-DOM index where this host component's children begin. Normally 0,
 * but when the component's own root vdom is a fragment, its children share
 * `parentEl` with outside siblings and start *after* them — so `offset`
 * shifts a logical child index to its true position among `parentEl`'s
 * childNodes. Queried live each time, since the DOM shifts as ops are applied.
 */
function childOffset(hostComponent) {
  return hostComponent?.offset ?? 0;
}

function addChild({ item, index }, { parentEl, hostComponent }) {
  mountDOM(item, parentEl, index + childOffset(hostComponent), hostComponent);
}

function removeChild({ item }) {
  destroyDOM(item);
}

function moveChild({ originalIndex, index }, { oldChildren, newChildren, parentEl, hostComponent }) {
  const oldChild = oldChildren[originalIndex];
  const newChild = newChildren[index];
  const elAtTargetIndex = parentEl.childNodes[index + childOffset(hostComponent)];

  parentEl.insertBefore(oldChild.el, elAtTargetIndex);
  patchDOM(oldChild, newChild, parentEl, hostComponent);
}

function patchChildInPlace({ originalIndex, index }, { oldChildren, newChildren, parentEl, hostComponent }) {
  patchDOM(oldChildren[originalIndex], newChildren[index], parentEl, hostComponent);
}

function patchComponent(oldVdom, newVdom) {
  const { component } = oldVdom;
  const { children } = newVdom;
  const { props } = extractPropsAndEvents(newVdom);
  component.setExternalContent(children);
  component.updateProps(props);
  newVdom.component = component;
  newVdom.el = component.firstElement;
}