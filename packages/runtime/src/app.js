import { mountDOM } from "./mount-dom";
import { destroyDOM } from "./destroy-dom";
import { h } from "./h";
import { NoopRouter } from './router';

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

  return {
    mount(_parentEl) {
      if (isMounted) {
        throw new Error("The application is already mounted");
      }
      parentEl = _parentEl;
      vdom = h(RootComponent, props);
      mountDOM(vdom, parentEl, null, { appContext: context });

      context.router.init();

      isMounted = true;
    },

    unmount() {
      if (!isMounted) {
        throw new Error("The application is not mounted");
      }
      destroyDOM(vdom);
      context.router.destroy();
      reset();
    },
  };
}
