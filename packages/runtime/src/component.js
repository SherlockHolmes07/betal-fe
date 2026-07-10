import equal from 'fast-deep-equal';
import { destroyDOM } from "./destroy-dom.js";
import { mountDOM } from "./mount-dom.js";
import { patchDOM } from "./patch-dom.js";
import { DOM_TYPES } from "./h.js";
import { extractChildNodes } from "./vdom-utils.js";
import { hasOwnProperty } from './utils/objects.js';
import { Dispatcher } from './dispatcher.js';
import { enqueueJob } from './scheduler.js';
import { fillSlots, containsSlot } from './slots.js'
import { EMPTY_FUNCTION } from './constants.js';

export function defineComponent({ render, state, onMounted = EMPTY_FUNCTION, onUnmounted = EMPTY_FUNCTION, onPropsChange = EMPTY_FUNCTION, onStateChange = EMPTY_FUNCTION, ...methods }) {

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
    #hasSlot = false;

    /**
     * Creates a component instance with the given props, event handlers
     * (from the parent's `on*` props), and parent component (if any).
     */
    constructor(props = {}, eventHandlers = {}, parentComponent = null) {
      this.props = props;
      this.state = state ? state(props) : {};
      this.#eventHandlers = eventHandlers;
      this.#parentComponent = parentComponent;
    }

    updateState(newState) {
      this.state = { ...this.state, ...newState };
      this.#patch();
      enqueueJob(() => this.onStateChange());
    }

    render() {
      // Calls the user-defined render fn with `this` bound to the component
      // instance, so it can read this.state/this.props and call public
      // methods. If it used hSlot(), project this.#children into the slot(s).
      const vdom = render.call(this);
      // Captured here, before fillSlots below replaces every SLOT node with
      // a FRAGMENT in place.
      this.#hasSlot = containsSlot(vdom);
      if (this.#hasSlot) {
        fillSlots(vdom, this.#children);
      }

      return vdom;
    }

    /**
     * Renders and mounts the component's DOM into `hostEl` at `index`.
     */
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

    /**
     * Removes the component's DOM and cleans up its event subscriptions.
     */
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

    // Lifecycle hooks below run the user-defined fn bound to `this` (same
    // reason as render()), wrapped in Promise.resolve so callers can always
    // await them whether the user's hook is sync or already async.
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

    /**
     * Merges `props` into this.props (no-op if unchanged), re-renders, and
     * notifies onPropsChange.
     */
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

    /**
     * Dispatches `eventName` to whoever is listening via this component's
     * `on*` event handlers.
     */
    emit(eventName, payload) {
      this.#dispatcher.dispatch(eventName, payload);
    }

    /**
     * Sets the shared app context, readable via the `appContext` getter.
     */
    setAppContext(appContext) {
      this.#appContext = appContext;
    }

    /**
     * Sets the child vdom nodes used to fill this component's slot(s). If
     * the component is already mounted and actually has a slot to fill,
     * re-renders right away.
     */
    setExternalContent(children) {
      this.#children = children;

      if (this.#isMounted && this.#hasSlot) {
        this.#patch();
      }
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

    /**
     * All root DOM elements rendered by this component (flattened across
     * fragments and nested components).
     */
    get elements() {
      if (this.#vdom == null) {
        return [];
      }
      if (this.#vdom.type === DOM_TYPES.FRAGMENT) {
        return this.#getFragmentElements();
      }
      return [this.#vdom.el];
    }

    #getFragmentElements() {
      return extractChildNodes(this.#vdom).flatMap((child) => {
        if (child.type === DOM_TYPES.COMPONENT) {
          return child.component.elements;
        }
        return [child.el];
      });
    }

    get firstElement() {
      return this.elements[0];
    }

    /**
     * Index of this component's first element among its host element's
     * children. 0 unless the root vdom is a fragment.
     */
    get offset() {
      if (this.#vdom.type === DOM_TYPES.FRAGMENT) {
        return Array.from(this.#hostEl.children).indexOf(this.firstElement);
      }
      return 0;
    }
  }

  attachUserMethods(Component, methods);

  return Component;
}

/**
 * Adds the caller's extra methods (anything passed to defineComponent()
 * besides render/state/lifecycle hooks) onto the component prototype.
 */
function attachUserMethods(Component, methods) {
  for (const methodName in methods) {
    if (hasOwnProperty(Component.prototype, methodName)) {
      throw new Error(`Method "${methodName}()" already exists in the component`);
    }
    Component.prototype[methodName] = methods[methodName];
  }
}
