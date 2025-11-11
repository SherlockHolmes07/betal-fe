import { DOM_TYPES } from "./h.js";
import { setAttributes } from './attributes.js'
import { addEventListeners } from './events.js'

export function mountDOM(vDom, parentElement) {
  switch (vDom.type) {
    case DOM_TYPES.TEXT: {
      createTextNode(vDom, parentElement);
      break;
    }
    case DOM_TYPES.ELEMENT: {
      createElementNode(vDom, parentElement);
      break;
    }
    case DOM_TYPES.FRAGMENT: {
      createFragmentNode(vDom, parentElement);
      break;
    }
    default: {
      throw new Error(`Can't mount DOM of type: ${vDom.type}`)
    }
  }
}

function createTextNode(vDom, parentElement) {
  const { value } = vDom;
  const textNode = document.createTextNode(value);
  vDom.el = textNode;
  parentElement.appendChild(textNode);
}

function createFragmentNode(vDom, parentElement) {
  const { children } = vDom;
  vDom.el = parentElement;

  children.forEach((child) => mountDOM(child, parentElement));
}

function createElementNode(vDom, parentElement) {
  const { tag, props, children } = vDom;

  const element = document.createElement(tag);
  addProps(element, props, vDom);
  vDom.el = element;

  children.forEach((child) => mountDOM(child, element));
  parentElement.appendChild(element);
}

function addProps(el, props, vdom) {
  const { on: events, ...attrs } = props;
  vdom.listeners = addEventListeners(events, el);
  setAttributes(el, attrs);
}