import { Dispatcher } from "./dispatcher.js";
import { makeRouteMatcher } from "./route-matchers.js";
import { assert } from "./utils/assert.js";

const ROUTER_EVENT = "router-event";

export class HashRouter {
  #isInitialized = false;
  #matchers = [];
  #matchedRoute = null;
  #dispatcher = new Dispatcher();
  #subscriptions = new WeakMap();
  #subscriberFns = new Set();
  #scrollBehavior = 'top';

  get matchedRoute() {
    return this.#matchedRoute;
  }

  #params = {};
  get params() {
    return this.#params;
  }

  #query = {};
  get query() {
    return this.#query;
  }

  get #currentRouteHash() {
    const hash = document.location.hash;

    if (hash === "") {
      return "/";
    }

    return hash.slice(1);
  }

  // Saved to a variable to be able to remove the event listener in the destroy() method.
  #onPopState = () => this.#matchCurrentRoute();

  constructor(routes = [], options = {}) {
    assert(Array.isArray(routes), "Routes must be an array");
    this.#matchers = routes.map(makeRouteMatcher);
    
    if (options.scrollBehavior !== undefined) {
      this.#scrollBehavior = options.scrollBehavior;
    }
  }

  async init() {
    if (this.#isInitialized) {
      return;
    }

    if (document.location.hash === "") {
      window.history.replaceState({}, "", "#/");
    }

    window.addEventListener("popstate", this.#onPopState);
    await this.#matchCurrentRoute();

    this.#isInitialized = true;
  }

  destroy() {
    if (!this.#isInitialized) {
      return;
    }

    window.removeEventListener("popstate", this.#onPopState);
    Array.from(this.#subscriberFns).forEach(this.unsubscribe, this);
    this.#isInitialized = false;
  }

  async navigateTo(path) {
    const hashIndex = path.indexOf('#', 1); // Skip first # which is for hash routing
    const pathWithoutHash = hashIndex !== -1 ? path.slice(0, hashIndex) : path;
    const hash = hashIndex !== -1 ? path.slice(hashIndex + 1) : null;

    const matcher = this.#matchers.find((matcher) => matcher.checkMatch(pathWithoutHash));

    if (matcher == null) {
      console.warn(`[Router] No route matches path "${pathWithoutHash}"`);

      this.#matchedRoute = null;
      this.#params = {};
      this.#query = {};

      return;
    }

    if (matcher.isRedirect) {
      return this.navigateTo(matcher.route.redirect);
    }

    const from = this.#matchedRoute;
    const to = matcher.route;
    const { shouldNavigate, shouldRedirect, redirectPath } =
      await this.#canChangeRoute(from, to);

    if (shouldRedirect) {
      return this.navigateTo(redirectPath);
    }

    if (shouldNavigate) {
      this.#matchedRoute = matcher.route;
      this.#params = matcher.extractParams(pathWithoutHash);
      this.#query = matcher.extractQuery(pathWithoutHash);
      this.#pushState(path);
      this.#handleScrollBehavior(from, to, hash);

      this.#dispatcher.dispatch(ROUTER_EVENT, { from, to, router: this });
    }
  }

  #handleScrollBehavior(from, to, hash) {
    if (this.#scrollBehavior === false) {
      // do nothing
      return;
    }

    // ensure DOM is updated before scrolling
    setTimeout(() => {
      if (typeof this.#scrollBehavior === 'function') {
        const position = this.#scrollBehavior(from, to, { hash });
        if (position) {
          window.scrollTo({
            left: position.x || 0,
            top: position.y || 0,
            behavior: position.behavior || 'auto'
          });
        }
      } else if (this.#scrollBehavior === 'top') {
        if (hash) {
          const element = document.getElementById(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'auto' });
            return;
          }
        }
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }
    }, 0);
  }

  back() {
    window.history.back();
  }

  forward() {
    window.history.forward();
  }

  subscribe(handler) {
    const unsubscribe = this.#dispatcher.subscribe(ROUTER_EVENT, handler);
    this.#subscriptions.set(handler, unsubscribe);
    this.#subscriberFns.add(handler);
  }

  unsubscribe(handler) {
    const unsubscribe = this.#subscriptions.get(handler);
    if (unsubscribe) {
      unsubscribe();
      this.#subscriptions.delete(handler);
      this.#subscriberFns.delete(handler);
    }
  }

  #pushState(path) {
    window.history.pushState({}, "", `#${path}`);
  }

  #matchCurrentRoute() {
    return this.navigateTo(this.#currentRouteHash);
  }

  async #canChangeRoute(from, to) {
    const guard = to.beforeEnter;

    if (typeof guard !== "function") {
      return {
        shouldRedirect: false,
        shouldNavigate: true,
        redirectPath: null,
      };
    }

    const result = await guard(from?.path, to?.path);
    if (result === false) {
      return {
        shouldRedirect: false,
        shouldNavigate: false,
        redirectPath: null,
      };
    }

    if (typeof result === "string") {
      return {
        shouldRedirect: true,
        shouldNavigate: false,
        redirectPath: result,
      };
    }

    return {
      shouldRedirect: false,
      shouldNavigate: true,
      redirectPath: null,
    };
  }
}

export class NoopRouter {
  init() {}
  destroy() {}
  navigateTo() {}
  back() {}
  forward() {}
  subscribe() {}
  unsubscribe() {}
}
