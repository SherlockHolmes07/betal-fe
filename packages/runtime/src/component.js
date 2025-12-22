import equal from 'fast-deep-equal';
import { destroyDOM } from "./destroy-dom.js";
import { mountDOM } from "./mount-dom.js";
import { patchDOM } from "./patch-dom.js";
import { DOM_TYPES, extractChildren, didCreateSlot, resetDidCreateSlot } from "./h.js";
import { hasOwnProperty } from './utils/objects.js';
import { Dispatcher } from './dispatcher.js';
import { enqueueJob } from './scheduler.js';
import { fillSlots } from './slots.js'

const emptyFunction = () => {};

export function defineComponent({ render, state, onMounted = emptyFunction, onUnmounted = emptyFunction, onPropsChange = emptyFunction, onStateChange = emptyFunction, ...methods }) {
  class Component {
    #vdom = null;
    #isMounted = false;
    #hostEl = null;
    #eventHandlers = null;
    #parentComponent = null;
    #dispatcher = new Dispatcher();
    #subscriptions = [];
    #children = [];
    #appContext = null;

    constructor(props = {}, eventHandlers = {}, parentComponent = null) {
      this.props = props;
      this.state = state ? state(props) : {};
      this.#eventHandlers = eventHandlers;
      this.#parentComponent = parentComponent;
    }

    setExternalContent(children) {
      this.#children = children;
    }

    updateState(newState) {
      this.state = { ...this.state, ...newState };
      this.#patch();
      enqueueJob(() => this.onStateChange());
    }

    render() {
      const vdom = render.call(this);
      if (didCreateSlot()) {
        fillSlots(vdom, this.#children);
        resetDidCreateSlot();
      }

      return vdom;
    }

    mount(hostEl, index = null) {
      if (this.#isMounted) {
        throw new Error("Component is already mounted");
      }
      this.#vdom = this.render();
      mountDOM(this.#vdom, hostEl, index, this);
      this.#wireEventHandlers();
      this.#hostEl = hostEl;
      this.#isMounted = true;
    }

    unmount() {
      if (!this.#isMounted) {
        throw new Error("Component is not mounted");
      }
      destroyDOM(this.#vdom);
      this.#subscriptions.forEach((unsubscribe) => unsubscribe());
      this.#subscriptions = [];
      this.#vdom = null;
      this.#hostEl = null;
      this.#isMounted = false;
    }

    onMounted() {
      return Promise.resolve(onMounted.call(this));
    }
    
    onUnmounted() {
      return Promise.resolve(onUnmounted.call(this));
    }

    onPropsChange(newProps, oldProps) {
      return Promise.resolve(onPropsChange.call(this, newProps, oldProps));
    }

    onStateChange() {
      return Promise.resolve(onStateChange.call(this));
    }

    updateProps(props) {
      const newProps = { ...this.props, ...props };
      if (equal(this.props, newProps)) {
        return;
      }
      const oldProps = this.props;
      this.props = newProps;
      this.#patch();
      enqueueJob(() => this.onPropsChange(this.props, oldProps));
    }

    emit(eventName, payload) {
      this.#dispatcher.dispatch(eventName, payload);
    }

    setAppContext(appContext) {
      this.#appContext = appContext;
    }

    get appContext() {
      return this.#appContext;
    }

    #patch() {
      if (!this.#isMounted) {
        throw new Error("Component is not mounted");
      }
      const vdom = this.render();
      this.#vdom = patchDOM(this.#vdom, vdom, this.#hostEl, this);
    }

    #wireEventHandlers() {
      this.#subscriptions = Object.entries(this.#eventHandlers).map(
        ([eventName, handler]) => this.#wireEventHandler(eventName, handler)
      );
    }

    #wireEventHandler(eventName, handler) {
      return this.#dispatcher.subscribe(eventName, (payload) => {
        if (this.#parentComponent) {
          handler.call(this.#parentComponent, payload);
        } else {
          handler(payload);
        }
      });
    }

    get elements() {
      if (this.#vdom == null) {
        return [];
      }
      if (this.#vdom.type === DOM_TYPES.FRAGMENT) {
        return extractChildren(this.#vdom).flatMap((child) => {
          if (child.type === DOM_TYPES.COMPONENT) {
            return child.component.elements;
          }
          return [child.el];
        });
      }
      return [this.#vdom.el];
    }

    get firstElement() {
      return this.elements[0];
    }

    get offset() {
      if (this.#vdom.type === DOM_TYPES.FRAGMENT) {
        return Array.from(this.#hostEl.children).indexOf(this.firstElement);
      }
      return 0;
    }
  }

  for(const methodName in methods) {
    if (hasOwnProperty(Component, methodName)) {
      throw new Error(`Method "${methodName}()" already exists in the component`);
    }
    Component.prototype[methodName] = methods[methodName];
  }

  return Component;
}
