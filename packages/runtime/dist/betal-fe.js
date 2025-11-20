function addEventListener(eventName, handler, el) {
  el.addEventListener(eventName, handler);
  return handler;
}
function addEventListeners(events = {}, el) {
  const addedEventListeners = {};
  Object.entries(events).forEach(([eventName, handler]) => {
    addedEventListeners[eventName] = addEventListener(eventName, handler, el);
  });
  return addedEventListeners;
}
function removeEventListeners(listeners = {}, el) {
  Object.entries(listeners).forEach(([eventName, handler]) => {
    el.removeEventListener(eventName, handler);
  });
}

function withoutNulls(arr) {
  return arr.filter((item) => item != null);
}

const DOM_TYPES = {
  TEXT: "text",
  ELEMENT: "element",
  FRAGMENT: "fragment",
};
function h(tag, props = {}, children = []) {
  return {
    type: DOM_TYPES.ELEMENT,
    tag,
    props,
    children: mapTextNodes(withoutNulls(children)),
  };
}
function mapTextNodes(nodes) {
  return nodes.map((node) =>
    typeof node === "string" ? hString(node) : node
  );
}
function hString(str) {
  return { type: DOM_TYPES.TEXT, value: str };
}
function hFragment(vNodes) {
  return {
    type: DOM_TYPES.FRAGMENT,
    children: mapTextNodes(withoutNulls(vNodes)),
  };
}

function destroyDOM(vDom) {
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

class Dispatcher {
  #subs = new Map();
  #afterHandlers = [];
  subscribe(commandName, handler) {
    if (!this.#subs.has(commandName)) {
      this.#subs.set(commandName, []);
    }
    const handlers = this.#subs.get(commandName);
    if (handlers.includes(handler)) {
      return () => {};
    }
    handlers.push(handler);
    return () => {
      const idx = handlers.indexOf(handler);
      handlers.splice(idx, 1);
    };
  }
  afterEveryCommand(handler) {
    this.#afterHandlers.push(handler);
    return () => {
      const idx = this.#afterHandlers.indexOf(handler);
      this.#afterHandlers.splice(idx, 1);
    };
  }
  dispatch(commandName, payload) {
    if (this.#subs.has(commandName)) {
      this.#subs.get(commandName).forEach((handler) => handler(payload));
    }
    else {
      console.warn(`No handlers for command: ${commandName}`);
    }
    this.#afterHandlers.forEach((handler) => handler());
  }
}

function setAttributes(el, attrs) {
  const { class: className, style, ...otherAttrs } = attrs;
  if (className) {
    setClass(el, className);
  }
  if (style) {
    Object.entries(style).forEach(([prop, value]) => {
      setStyle(el, prop, value);
    });
  }
  for (const [name, value] of Object.entries(otherAttrs)) {
    setAttribute(el, name, value);
  }
}
function setClass(el, className) {
  el.className = '';
  if (typeof className === 'string') {
    el.className = className;
  } else if (Array.isArray(className)) {
    el.classList.add(...className);
  }
}
function setStyle(el, prop, value) {
  el.style[prop] = value;
}
function setAttribute(el, name, value) {
  if (value == null) {
    removeAttribute(el, name);
  } else if (name.startsWith("data-")) {
    el.setAttribute(name, value);
  } else {
    el[name] = value;
  }
}
function removeAttribute(el, name) {
  el[name] = null;
  el.removeAttribute(name);
}

function mountDOM(vDom, parentElement) {
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

function createApp({ state, view, reducers = {} }) {
  let parentEl = null;
  let vdom = null;
  const dispatcher = new Dispatcher();
  const subscriptions = [dispatcher.afterEveryCommand(renderApp)];
  function emit(eventName, payload) {
    dispatcher.dispatch(eventName, payload);
  }
  for (const actionName in reducers) {
    const reducer = reducers[actionName];
    const subs = dispatcher.subscribe(actionName, (payload) => {
      state = reducer(state, payload);
    });
    subscriptions.push(subs);
  }
  function renderApp() {
    if (vdom) {
      destroyDOM(vdom);
    }
    vdom = view(state, emit);
    mountDOM(vdom, parentEl);
  }
  return {
    mount(_parentEl) {
      parentEl = _parentEl;
      renderApp();
    },
    unmount() {
      destroyDOM(vdom);
      vdom = null;
      subscriptions.forEach((unsub) => unsub());
    }
  }
}

export { createApp, h, hFragment, hString };
