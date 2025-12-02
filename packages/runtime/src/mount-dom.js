import { DOM_TYPES } from "./h.js";
import { setAttributes } from "./attributes.js";
import { addEventListeners } from "./events.js";
import { enqueueJob } from './scheduler.js';
import { extractPropsAndEvents } from './utils/props.js';

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

  children.forEach((child) =>
    mountDOM(child, parentElement, index ? index + 1 : null, hostComponent)
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

function addProps(el,vdom, hostComponent) {
  const { props: attrs, events } = extractPropsAndEvents(vdom);
  vdom.listeners = addEventListeners(events, el, hostComponent);
  setAttributes(el, attrs);
}

function insert(el, parentEl, index) {
  if (index == null) {
    parentEl.append(el);
    return;
  }

  if (index < 0) {
    throw new Error(`Index must be a positive integer, got ${index}`);
  }

  const children = parentEl.childNodes;

  if (index >= children.length) {
    parentEl.append(el);
  } else {
    parentEl.insertBefore(el, children[index]);
  }
}

function createComponentNode(vdom, parentEl, index, hostComponent) {
  const Component = vdom.tag;
  const { props, events } = extractPropsAndEvents(vdom);
  const component = new Component(props, events, hostComponent);
  component.mount(parentEl, index);
  vdom.component = component;
  vdom.el = component.firstElement;
}
