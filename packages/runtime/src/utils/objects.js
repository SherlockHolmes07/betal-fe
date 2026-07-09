/**
 * Diffs two flat objects by key, using strict equality (`!==`) to decide
 * whether a shared key's value changed. Used by patch-dom.js to figure out
 * which attributes, style properties, or event listeners actually need to
 * be touched, instead of clearing and re-applying everything.
 *
 * @param {Object} oldObj - The previous key/value snapshot.
 * @param {Object} newObj - The current key/value snapshot.
 * @returns {{added: string[], removed: string[], updated: string[]}} Keys present only in `newObj`, keys present only in `oldObj`, and keys present in both whose values differ.
 */
export function objectsDiff(oldObj, newObj) {
  const oldKeys = Object.keys(oldObj);
  const newKeys = Object.keys(newObj);

  return {
    added: newKeys.filter((key) => !hasOwnProperty(oldObj, key)),
    removed: oldKeys.filter((key) => !hasOwnProperty(newObj, key)),
    updated: newKeys.filter(
      (key) => hasOwnProperty(oldObj, key) && oldObj[key] !== newObj[key]
    ),
  };
}

/**
 * Safe wrapper around `Object.prototype.hasOwnProperty` — checks whether
 * `obj` itself (not its prototype chain) has `prop`, even if `obj`
 * shadows or lacks its own `hasOwnProperty` (e.g. `Object.create(null)`).
 *
 * @param {Object} obj - The object to check.
 * @param {string} prop - The property name to look for.
 * @returns {boolean} True if `prop` is an own property of `obj`.
 */
export function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}
