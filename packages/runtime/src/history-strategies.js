/**
 * The URL behaviors that differ between a hash-based and a real
 * (History API) router — everything else in `Router` (route matching,
 * guards, scroll behavior, subscriptions) is identical regardless of which
 * of these is plugged in.
 *
 * @typedef {Object} HistoryStrategy
 * @property {() => string} getCurrentPath - The current path (plus query and in-page anchor, if any) as one string, e.g. `/user/5?tab=profile#comments`.
 * @property {(path: string) => void} pushPath - Writes a new path to the URL as a fresh history entry.
 * @property {(path: string) => void} replacePath - Replaces the current history entry with a new path.
 * @property {() => void} normalizeInitialUrl - One-time cleanup applied before the first route match, e.g. giving an empty URL a sane default. A no-op for strategies that never need it.
 * @property {(path: string) => string} linkHref - Formats `path` as a real `href` a plain `<a>` tag can use (so right-click / open-in-new-tab / hover-preview work correctly).
 */

/** @type {HistoryStrategy} */
export const hashHistoryStrategy = {
  getCurrentPath() {
    const hash = location.hash;
    return hash === '' ? '/' : hash.slice(1);
  },
  pushPath(path) {
    history.pushState({}, '', `#${path}`);
  },
  replacePath(path) {
    history.replaceState({}, '', `#${path}`);
  },
  normalizeInitialUrl() {
    if (location.hash === '') {
      history.replaceState({}, '', '#/');
    }
  },
  linkHref(path) {
    return `#${path}`;
  },
};

/**
 * Assumes the app is hosted at the domain root — subpath deployments
 * (e.g. `example.com/some/app/`) aren't supported yet. A future
 * `createBrowserHistoryStrategy(basePath)` would strip `basePath` in
 * `getCurrentPath` and prepend it in `pushPath`/`replacePath`/`linkHref`;
 * that extension wouldn't require changes to `Router` itself.
 *
 * @type {HistoryStrategy}
 */
export const browserHistoryStrategy = {
  // Must include search + hash, not just pathname — navigateTo and
  // route-matchers.js expect one string shaped like "/segment?query#anchor".
  getCurrentPath() {
    return `${location.pathname}${location.search}${location.hash}`;
  },
  pushPath(path) {
    history.pushState({}, '', path);
  },
  replacePath(path) {
    history.replaceState({}, '', path);
  },
  normalizeInitialUrl() {
    // No-op: location.pathname is never actually empty, nothing to normalize.
  },
  linkHref(path) {
    return path;
  },
};
