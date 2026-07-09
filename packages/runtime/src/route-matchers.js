const CATCH_ALL_ROUTE = "*";

/**
 * Compiles a route definition (`{ path, component, ... }`) into a matcher
 * usable by `HashRouter`: an object with `checkMatch(path)`, `extractParams
 * (path)`, `extractQuery(path)`, plus the original `route` and an
 * `isRedirect` flag. Picks one of two matcher shapes depending on whether
 * the path has `:param` segments — a plain route never pays for the regex
 * named-group machinery a dynamic one needs.
 *
 * @param {{path: string, component?: Function, redirect?: string, beforeEnter?: Function}} route - A single entry from the routes array passed to `new HashRouter(routes)`.
 * @returns {{route: Object, isRedirect: boolean, checkMatch: (path: string) => boolean, extractParams: (path: string) => Object, extractQuery: (path: string) => Object}} The compiled matcher.
 */
export function makeRouteMatcher(route) {
  return routeHasParams(route)
    ? makeMatcherWithParams(route)
    : makeMatcherWithoutParams(route);
}

function routeHasParams({ path }) {
  return path.includes(":");
}

function makeMatcherWithParams(route) {
  const regex = makeRouteWithParamsRegex(route);
  const isRedirect = typeof route.redirect === "string";

  return {
    route,
    isRedirect,
    checkMatch(path) {
      return regex.test(stripQuery(path));
    },
    extractParams(path) {
      const { groups } = regex.exec(stripQuery(path));
      return groups;
    },
    extractQuery,
  };
}

/**
 * Turns a path with `:name` segments (e.g. `/user/:id/post/:postId`) into
 * an anchored regex with one named capture group per param, so a later
 * `regex.exec(path).groups` hands back `{ id, postId }` directly —
 * `:id` becomes `(?<id>[^/]+)`: "one path segment, anything but a slash."
 */
function makeRouteWithParamsRegex({ path }) {
  const regex = path.replace(
    /:([^/]+)/g,
    (_, paramName) => `(?<${paramName}>[^/]+)`
  );

  return new RegExp(`^${regex}$`);
}

function makeMatcherWithoutParams(route) {
  const regex = makeRouteWithoutParamsRegex(route);
  const isRedirect = typeof route.redirect === "string";

  return {
    route,
    isRedirect,
    checkMatch(path) {
      return regex.test(stripQuery(path));
    },
    extractParams() {
      return {};
    },
    extractQuery,
  };
}

/** The catch-all route `'*'` matches anything; every other static path matches only itself. */
function makeRouteWithoutParamsRegex({ path }) {
  if (path === CATCH_ALL_ROUTE) {
    return new RegExp("^.*$");
  }

  return new RegExp(`^${path}$`);
}

/**
 * Drops a trailing `?query` from `path`, if present. Route-matching regexes
 * are anchored (`^...$`) and their param groups are `[^/]+` — greedy enough
 * to swallow a `?` and everything after it — so without this, a query
 * string would either break a static route's match entirely or leak into
 * a dynamic param's extracted value. `extractQuery` deliberately does NOT
 * use this: it needs the query string still attached to parse it.
 */
function stripQuery(path) {
  const queryIndex = path.indexOf("?");
  return queryIndex === -1 ? path : path.slice(0, queryIndex);
}

/** Parses everything after `?` in `path` into a plain `{key: value}` object; `{}` if there's no query string. */
function extractQuery(path) {
  const queryIndex = path.indexOf("?");

  if (queryIndex === -1) {
    return {};
  }

  const search = new URLSearchParams(path.slice(queryIndex + 1));

  return Object.fromEntries(search.entries());
}
