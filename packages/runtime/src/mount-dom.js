import { DOM_TYPES } from "./h.js";
import { setAttributes } from './attributes.js'
import { addEventListeners } from './events.js'

export function mountDOM(vDom, parentElement, index) {
  switch (vDom.type) {
    case DOM_TYPES.TEXT: {
      createTextNode(vDom, parentElement, index);
      break;
    }
    case DOM_TYPES.ELEMENT: {
      createElementNode(vDom, parentElement, index);
      break;
    }
    case DOM_TYPES.FRAGMENT: {
      createFragmentNode(vDom, parentElement, index);
      break;
    }
    default: {
      throw new Error(`Can't mount DOM of type: ${vDom.type}`)
    }
  }
}

function createTextNode(vDom, parentElement, index) {
  const { value } = vDom;
  const textNode = document.createTextNode(value);
  vDom.el = textNode;
  insert(textNode, parentElement, index);
}

function createFragmentNode(vDom, parentElement, index) {
  const { children } = vDom;
  vDom.el = parentElement;

  children.forEach((child) => mountDOM(child, parentElement, index ? index + 1 : null));
}

function createElementNode(vDom, parentElement, index) {
  const { tag, props, children } = vDom;

  const element = document.createElement(tag);
  addProps(element, props, vDom);
  vDom.el = element;

  children.forEach((child) => mountDOM(child, element));
  insert(element, parentElement, index);
}

function addProps(el, props, vdom) {
  const { on: events, ...attrs } = props;
  vdom.listeners = addEventListeners(events, el);
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

  const children = parentEl.childNodes

  if (index >= children.length) {
    parentEl.append(el);
  } else {
    parentEl.insertBefore(el, children[index]);
  }
}