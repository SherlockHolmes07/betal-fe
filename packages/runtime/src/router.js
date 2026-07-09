import { Dispatcher } from "./dispatcher.js";
import { makeRouteMatcher } from "./route-matchers.js";
import { assert } from "./utils/assert.js";

const ROUTER_EVENT = "router-event";

/**
 * Hash-based (`#/path`) SPA router: matches `location.hash` against a list
 * of routes, exposes the current `matchedRoute`/`params`/`query`, and lets
 * components subscribe to navigation. Supports `:param` segments, a `*`
 * catch-all, string redirects, async `beforeEnter` guards, and configurable
 * scroll behavior. Always used through `appContext.router` (see app.js),
 * never constructed directly by components.
 */
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

  // The hash-routed path, with the leading "#" stripped and "" normalized
  // to "/" — i.e. what the rest of the router treats as "the current URL".
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

  /**
   * Starts listening for browser back/forward navigation and resolves the
   * route matching the page's current URL. Idempotent — a second call is a
   * no-op. Called once by `createBetalApp(...).mount()`.
   *
   * @returns {Promise<void>}
   */
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

  /**
   * Stops listening for navigation and unsubscribes every handler.
   * Called by `createBetalApp(...).unmount()`.
   *
   * @returns {void}
   */
  destroy() {
    if (!this.#isInitialized) {
      return;
    }

    window.removeEventListener("popstate", this.#onPopState);
    Array.from(this.#subscriberFns).forEach(this.unsubscribe, this);
    this.#isInitialized = false;
  }

  /**
   * Navigates to `path`, e.g. `'/user/5?tab=profile#comments'` — without
   * the router's own leading `#`. Redirects (a route's `redirect`, or a
   * `beforeEnter` guard returning a string) are followed automatically,
   * so callers never need to handle them.
   *
   * Resolves once navigation has either committed or been decided
   * against — awaiting it does not guarantee the route actually changed:
   * a `beforeEnter` guard can block it, and a path matching no route just
   * logs a warning and leaves the current route as-is. Neither case throws.
   *
   * @param {string} path - The path to navigate to, without the leading `#`.
   * @returns {Promise<void>}
   */
  async navigateTo(path) {
    const { pathWithoutHash, hash } = this.#splitOffAnchor(path);
    const matcher = this.#matchers.find((candidate) => candidate.checkMatch(pathWithoutHash));

    if (matcher == null) {
      this.#clearMatchedRoute(pathWithoutHash);
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
      this.#commitNavigation({ matcher, path, pathWithoutHash, from, to, hash });
    }
  }

  /** No route matched the path — reset to "nowhere," and say so. */
  #clearMatchedRoute(pathWithoutHash) {
    console.warn(`[Router] No route matches path "${pathWithoutHash}"`);
    this.#matchedRoute = null;
    this.#params = {};
    this.#query = {};
  }

  /** Makes a matched, guard-approved navigation the current reality: updates route state, browser history, scroll position, and notifies subscribers. */
  #commitNavigation({ matcher, path, pathWithoutHash, from, to, hash }) {
    this.#matchedRoute = matcher.route;
    this.#params = matcher.extractParams(pathWithoutHash);
    this.#query = matcher.extractQuery(pathWithoutHash);
    this.#pushState(path);
    this.#handleScrollBehavior(from, to, hash);

    this.#dispatcher.dispatch(ROUTER_EVENT, { from, to, router: this });
  }

  /**
   * Splits an in-page `#anchor` off the end of `path`, if present — e.g.
   * `'/docs#install'` → `{ pathWithoutHash: '/docs', hash: 'install' }`.
   * Searches from index 1 so the route's own leading `#` (hash routing)
   * is never mistaken for an anchor. Route matching and the eventual
   * scroll-to-anchor behavior each need one half of this split.
   */
  #splitOffAnchor(path) {
    const hashIndex = path.indexOf('#', 1);
    return hashIndex !== -1
      ? { pathWithoutHash: path.slice(0, hashIndex), hash: path.slice(hashIndex + 1) }
      : { pathWithoutHash: path, hash: null };
  }

  /**
   * Applies `#scrollBehavior` after a successful navigation. Deferred with
   * `setTimeout(..., 0)` so the DOM has already been patched to the new
   * route before anything tries to scroll — scrolling to an element or
   * measuring positions against the old DOM would be wrong otherwise.
   */
  #handleScrollBehavior(from, to, hash) {
    if (this.#scrollBehavior === false) {
      return;
    }

    setTimeout(() => this.#applyScroll(from, to, hash), 0);
  }

  /** Performs the actual scroll, once the new route's DOM is guaranteed to exist. */
  #applyScroll(from, to, hash) {
    if (typeof this.#scrollBehavior === 'function') {
      this.#scrollToCustomPosition(from, to, hash);
      return;
    }

    if (this.#scrollBehavior === 'top') {
      this.#scrollToTopOrAnchor(hash);
    }
  }

  /** Delegates to the caller-supplied `scrollBehavior` function and applies whatever position it returns, if any. */
  #scrollToCustomPosition(from, to, hash) {
    const position = this.#scrollBehavior(from, to, { hash });
    if (!position) {
      return;
    }

    window.scrollTo({
      left: position.x || 0,
      top: position.y || 0,
      behavior: position.behavior || 'auto',
    });
  }

  /** The default `'top'` behavior: scroll to the in-page anchor if one was given and exists, otherwise to the top of the page. */
  #scrollToTopOrAnchor(hash) {
    const element = hash && document.getElementById(hash);
    if (element) {
      element.scrollIntoView({ behavior: 'auto' });
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }

  back() {
    window.history.back();
  }

  forward() {
    window.history.forward();
  }

  /**
   * Registers a handler to be called on every successful navigation.
   *
   * @param {(event: {from: Object|null, to: Object, router: HashRouter}) => void} handler
   */
  subscribe(handler) {
    // Keep track of the unsubscribe function for later removal,
    // and maintain the set of active subscribers for teardown.
    const unsubscribe = this.#dispatcher.subscribe(ROUTER_EVENT, handler);
    this.#subscriptions.set(handler, unsubscribe);
    this.#subscriberFns.add(handler);
  }

  /**
   * Removes a handler registered via `subscribe`.
   *
   * @param {Function} handler
   */
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

  /**
   * Runs `to.beforeEnter(fromPath, toPath)`, if defined, and translates its
   * result into a navigation decision: `false` blocks the navigation
   * entirely, a string redirects there instead, and anything else (including
   * `undefined`/`true`) allows it through. No guard at all always allows it.
   */
  async #canChangeRoute(from, to) {
    const guard = to.beforeEnter;

    if (typeof guard !== "function") {
      return allowNavigation();
    }

    const result = await guard(from?.path, to?.path);

    if (result === false) {
      return blockNavigation();
    }

    if (typeof result === "string") {
      return redirectTo(result);
    }

    return allowNavigation();
  }
}

function allowNavigation() {
  return { shouldRedirect: false, shouldNavigate: true, redirectPath: null };
}

function blockNavigation() {
  return { shouldRedirect: false, shouldNavigate: false, redirectPath: null };
}

function redirectTo(redirectPath) {
  return { shouldRedirect: true, shouldNavigate: false, redirectPath };
}

/**
 * A router that does nothing — every method is a no-op. `createBetalApp`
 * uses this as the default `appContext.router` when no real router is
 * configured, so components can always call `this.appContext.router.*`
 * without null-checking whether routing is actually set up.
 */
export class NoopRouter {
  init() {}
  destroy() {}
  navigateTo() {}
  back() {}
  forward() {}
  subscribe() {}
  unsubscribe() {}
}
