// Fallbacks used only if the registry can't be reached (offline, registry
// down, etc.) — kept current-ish deliberately, but this is a safety net,
// not the primary source of truth. The registry lookup always wins when
// it succeeds.
const FALLBACK_BETAL_FE_VERSION = '^4.6.0';
const FALLBACK_VITE_VERSION = '^7.2.4';

/**
 * Resolves the latest published version of an npm package as a caret range,
 * e.g. "^4.5.0". Falls back to a hardcoded, known-good range if the
 * registry can't be reached, rather than failing the whole scaffold over
 * a network hiccup.
 *
 * @param {string} packageName
 * @param {string} fallback - Caret-range string to use if the lookup fails.
 * @returns {Promise<string>}
 */
export async function resolveLatestVersion(packageName, fallback) {
  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}`);
    if (!response.ok) {
      throw new Error(`Registry responded with ${response.status}`);
    }
    const data = await response.json();
    const latest = data['dist-tags']?.latest;
    if (!latest) {
      throw new Error('No dist-tags.latest in registry response');
    }
    return `^${latest}`;
  } catch (error) {
    console.warn(`[create-betal-app] Could not resolve the latest version of "${packageName}" (${error.message}). Using ${fallback} instead.`);
    return fallback;
  }
}

export async function resolveBetalFeVersion() {
  return resolveLatestVersion('betal-fe', FALLBACK_BETAL_FE_VERSION);
}

export async function resolveViteVersion() {
  return resolveLatestVersion('vite', FALLBACK_VITE_VERSION);
}
