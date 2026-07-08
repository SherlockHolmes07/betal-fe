import { mountDOM } from "./mount-dom";
import { destroyDOM } from "./destroy-dom";
import { h } from "./h";
import { NoopRouter } from './router';

/**
 * Create a Betal application instance for the given root component.
 *
 * @param {Function|Object} RootComponent - Component definition to mount at the app root.
 * @param {Object} [props={}] - Props passed to the root component.
 * @param {Object} [options={}] - App-level options.
 * @param {Object} [options.router] - Router instance to expose to components via app context. Defaults to a no-op router.
 * @returns {{mount: function(Element): void, unmount: function(): void}} App instance with `mount`/`unmount` methods.
 */
export function createBetalApp(RootComponent, props = {}, options = {}) {
  let parentEl = null;
  let isMounted = false;
  let vdom = null;

  const context = {
    router: options.router || new NoopRouter(),
  }

  function reset() {
    parentEl = null;
    isMounted = false;
    vdom = null;
  }

  /**
   * Mount the root component's virtual DOM into the given host element
   * and initialize the router.
   *
   * @param {Element} _parentEl - DOM element to mount the app into.
   * @returns {void}
   */
  function mount(_parentEl) {
    if (isMounted) {
      throw new Error("The application is already mounted");
    }
    parentEl = _parentEl;
    vdom = h(RootComponent, props);
    mountDOM(vdom, parentEl, null, { appContext: context });

    context.router.init();

    isMounted = true;
  }

  /**
   * Tear down the mounted virtual DOM, destroy the router, and reset
   * internal state.
   *
   * @returns {void}
   */
  function unmount() {
    if (!isMounted) {
      throw new Error("The application is not mounted");
    }
    destroyDOM(vdom);
    context.router.destroy();
    reset();
  }

  return { mount, unmount };
}
