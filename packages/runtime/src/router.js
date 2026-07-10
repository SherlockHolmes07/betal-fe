import { Dispatcher } from "./dispatcher.js";
import { makeRouteMatcher } from "./route-matchers.js";
import { assert } from "./utils/assert.js";
import { hashHistoryStrategy, browserHistoryStrategy } from "./history-strategies.js";

const ROUTER_EVENT = "router-event";
const HISTORY_ACTION = Object.freeze({
  NONE: "none",
  PUSH: "push",
  REPLACE: "replace",
});

/**
 * Shared SPA router logic: matches the current URL against a list of
 * routes, exposes `matchedRoute`/`params`/`query`, and lets components
 * subscribe to navigation. Supports `:param` segments, a `*` catch-all,
 * string redirects, async `beforeEnter` guards, and configurable scroll
 * behavior.
 *
 * How the current path is read from the URL, and how a new one is written
 * to it, is delegated entirely to a `HistoryStrategy` (see
 * history-strategies.js) supplied by a subclass — everything else here is
 * identical regardless of whether that's hash-based or real History API
 * routing. Not exported: always used through `HashRouter`/`BrowserRouter`.
 */
class Router {
  #isInitialized = false;
  #matchers = [];
  #matchedRoute = null;
  #dispatcher = new Dispatcher();
  #subscriptions = new WeakMap();
  #subscriberFns = new Set();
  #scrollBehavior = 'top';
  #strategy;

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

  // Saved to a variable to be able to remove the event listener in the destroy() method.
  #onPopState = () => this.#matchCurrentRoute();

  constructor(routes = [], options = {}, strategy) {
    assert(Array.isArray(routes), "Routes must be an array");
    this.#matchers = routes.map(makeRouteMatcher);
    this.#strategy = strategy;

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

    this.#strategy.normalizeInitialUrl();

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
   * Navigates to an absolute app path and follows redirects automatically.
   *
   * @param {string} path - The path to navigate to, e.g. `/about`.
   * @returns {Promise<void>} Resolves when navigation finishes or is blocked.
   */
  navigateTo(path) {
    return this.#navigate(path, HISTORY_ACTION.PUSH);
  }

  async #navigate(path, historyAction) {
    assert(path.startsWith('/'), `Path must start with "/", got "${path}"`);

    const { pathWithoutHash, hash } = this.#splitOffAnchor(path);
    const matcher = this.#matchers.find((candidate) => candidate.checkMatch(pathWithoutHash));

    if (matcher == null) {
      this.#clearMatchedRoute(pathWithoutHash);
      return;
    }

    if (matcher.isRedirect) {
      return this.#navigate(
        matcher.route.redirect,
        redirectHistoryAction(historyAction)
      );
    }

    const transition = {
      matcher,
      path,
      pathWithoutHash,
      hash,
      from: this.#matchedRoute,
      to: matcher.route,
    };
    const { shouldNavigate, shouldRedirect, redirectPath } =
      await this.#canChangeRoute(transition.from, transition.to);

    if (shouldRedirect) {
      return this.#navigate(
        redirectPath,
        redirectHistoryAction(historyAction)
      );
    }

    if (shouldNavigate) {
      this.#commitNavigation(transition, historyAction);
    }
  }

  /** No route matched the path — reset to "nowhere," and say so. */
  #clearMatchedRoute(pathWithoutHash) {
    console.warn(`[Router] No route matches path "${pathWithoutHash}"`);
    this.#matchedRoute = null;
    this.#params = {};
    this.#query = {};
  }

  /** Commits a matched, guard-approved transition. */
  #commitNavigation(transition, historyAction) {
    const { matcher, path, pathWithoutHash, from, to, hash } = transition;

    this.#matchedRoute = matcher.route;
    this.#params = matcher.extractParams(pathWithoutHash);
    this.#query = matcher.extractQuery(pathWithoutHash);
    this.#updateHistory(path, historyAction);
    this.#handleScrollBehavior(from, to, hash);

    this.#dispatcher.dispatch(ROUTER_EVENT, { from, to, router: this });
  }

  #updateHistory(path, historyAction) {
    if (historyAction === HISTORY_ACTION.PUSH) {
      this.#strategy.pushPath(path);
    } else if (historyAction === HISTORY_ACTION.REPLACE) {
      this.#strategy.replacePath(path);
    }
  }

  /**
   * Splits an in-page `#anchor` off the end of `path`, if present — e.g.
   * `'/docs#install'` → `{ pathWithoutHash: '/docs', hash: 'install' }`.
   * Searches from index 1 so a hash-routed path's own leading `#` is never
   * mistaken for an anchor (moot for non-hash strategies, whose paths never
   * start with `#` at all). Route matching and the eventual
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
   * @param {(event: {from: Object|null, to: Object, router: Router}) => void} handler
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

  /**
   * Formats `path` as a real `href` for a plain `<a>` tag (used by
   * `RouterLink`), so right-click / open-in-new-tab / hover-preview work
   * correctly regardless of which URL strategy is in use.
   *
   * @param {string} path
   * @returns {string}
   */
  linkHref(path) {
    return this.#strategy.linkHref(path);
  }

  // Syncs router state to a URL the browser has already loaded.
  #matchCurrentRoute() {
    return this.#navigate(
      this.#strategy.getCurrentPath(),
      HISTORY_ACTION.NONE
    );
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

function redirectHistoryAction(historyAction) {
  return historyAction === HISTORY_ACTION.NONE
    ? HISTORY_ACTION.REPLACE
    : historyAction;
}

/**
 * Hash-based SPA router (`#/path`). Works on static hosts without server rewrites.
 *
 * @param {Array} [routes=[]] Route definitions.
 * @param {Object} [options={}] Router options.
 */
export class HashRouter extends Router {
  constructor(routes = [], options = {}) {
    super(routes, options, hashHistoryStrategy);
  }
}

/**
 * History API SPA router with clean paths (for example, `/user/42`).
 * Requires a production SPA fallback and currently supports root-hosted apps only.
 *
 * @param {Array} [routes=[]] Route definitions.
 * @param {Object} [options={}] Router options.
 */
export class BrowserRouter extends Router {
  constructor(routes = [], options = {}) {
    super(routes, options, browserHistoryStrategy);
  }
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
  linkHref(path) {
    return path;
  }
}
