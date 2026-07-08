import { removeEventListeners } from "./events.js";
import { DOM_TYPES } from "./h.js";
import { enqueueJob } from './scheduler.js';

/**
 * Tear down a mounted virtual DOM node, dispatching by node type: removes
 * the underlying DOM node(s), recurses into children, detaches event
 * listeners, and unmounts components.
 *
 * @param {Object} vDom - Mounted virtual DOM node to destroy.
 * @returns {void}
 */
export function destroyDOM(vDom) {
  const { type } = vDom;

  switch (type) {
    case DOM_TYPES.TEXT: {
      removeTextNode(vDom);
      break;
    }
    case DOM_TYPES.ELEMENT: {
      removeElementNode(vDom);
      break;
    }
    case DOM_TYPES.FRAGMENT: {
      removeFragmentNodes(vDom);
      break;
    }
    case DOM_TYPES.COMPONENT: {
      vDom.component.unmount();
      enqueueJob(() => vDom.component.onUnmounted());
      break;
    }
    default: {
      throw new Error(`Can't destroy DOM of type: ${type}`);
    }
  }
  delete vDom.el;
}

function removeTextNode(vDom) {
  const { el } = vDom;
  el.remove();
}

function removeElementNode(vdom) {
  const { el, children, listeners } = vdom;
  el.remove();
  children.forEach(destroyDOM);
  if (listeners) {
    removeEventListeners(listeners, el);
    delete vdom.listeners;
  }
}

function removeFragmentNodes(vDom) {
  const { children } = vDom;
  children.forEach(destroyDOM);
}
