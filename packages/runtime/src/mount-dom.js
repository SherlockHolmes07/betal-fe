import { DOM_TYPES } from "./h.js";
import { setAttributes } from "./attributes.js";
import { addEventListeners } from "./events.js";
import { enqueueJob } from './scheduler.js';
import { extractPropsAndEvents } from './utils/props.js';

/**
 * Mount a virtual DOM node into the real DOM, dispatching by node type.
 * Recurses into children for elements and fragments, and instantiates the
 * component class for component nodes.
 *
 * @param {Object} vDom - Virtual DOM node to mount (text, element, component, or fragment).
 * @param {Element} parentElement - DOM element to mount the node into.
 * @param {number|null} index - Position among `parentElement`'s children to insert at, or null to append.
 * @param {Object|null} [hostComponent=null] - Component instance that owns this vDom tree, used for event handler binding.
 * @returns {void}
 */
export function mountDOM(vDom, parentElement, index, hostComponent = null) {
  switch (vDom.type) {
    case DOM_TYPES.TEXT: {
      createTextNode(vDom, parentElement, index);
      break;
    }
    case DOM_TYPES.ELEMENT: {
      createElementNode(vDom, parentElement, index, hostComponent);
      break;
    }
    case DOM_TYPES.COMPONENT: {
      createComponentNode(vDom, parentElement, index, hostComponent);
      // Enqueue the onMounted hook to be executed after the DOM mounted.
      enqueueJob(() => vDom.component.onMounted());
      break;
    }
    case DOM_TYPES.FRAGMENT: {
      createFragmentNode(vDom, parentElement, index, hostComponent);
      break;
    }
    default: {
      throw new Error(`Can't mount DOM of type: ${vDom.type}`);
    }
  }
}

function createTextNode(vDom, parentElement, index) {
  const { value } = vDom;
  const textNode = document.createTextNode(value);
  vDom.el = textNode;
  insert(textNode, parentElement, index);
}

function createFragmentNode(vDom, parentElement, index, hostComponent) {
  const { children } = vDom;
  vDom.el = parentElement;

  // Each child lands at `index` plus its own position within the fragment,
  // so multiple children keep their relative order instead of all competing
  // for the same slot (which would insert them in reverse). When `index` is
  // null, every child is simply appended, in order.
  children.forEach((child, offset) =>
    mountDOM(child, parentElement, index == null ? null : index + offset, hostComponent)
  );
}

function createElementNode(vDom, parentElement, index, hostComponent) {
  const { tag, children } = vDom;

  const element = document.createElement(tag);
  addProps(element, vDom, hostComponent);
  vDom.el = element;

  children.forEach((child) => mountDOM(child, element, null, hostComponent));
  insert(element, parentElement, index);
}

/**
 * Split a vDom's props into attributes and event listeners, then apply
 * both to the given DOM element. 
 */
function addProps(el,vdom, hostComponent) {
  const { props: attrs, events } = extractPropsAndEvents(vdom);
  // The bound listeners are stashed back on the vDom so they can be removed later during unmount.
  vdom.listeners = addEventListeners(events, el, hostComponent);
  setAttributes(el, attrs);
}

/**
 * Insert a DOM node into a parent at a given child index, or append it
 * if no index is given.
 */
function insert(el, parentEl, index) {
  if (index == null) {
    parentEl.append(el);
    return;
  }

  if (index < 0) {
    throw new Error(`Index must be a positive integer, got ${index}`);
  }

  const children = parentEl.childNodes;

  // If the target index is past the end, appending is equivalent and simpler.
  if (index >= children.length) {
    parentEl.append(el);
  } else {
    parentEl.insertBefore(el, children[index]);
  }
}

/**
 * Instantiate a component vDom's component class, wire up its external
 * content and app context, and mount it into the parent element.
 */
function createComponentNode(vdom, parentEl, index, hostComponent) {
  const { tag: Component, children } = vdom
  const { props, events } = extractPropsAndEvents(vdom);
  const component = new Component(props, events, hostComponent);
  component.setExternalContent(children);
  component.setAppContext(hostComponent?.appContext ?? {});

  component.mount(parentEl, index);
  // The vDom is updated with the component instance and its first element for future reference.
  vdom.component = component;
  vdom.el = component.firstElement;
}
