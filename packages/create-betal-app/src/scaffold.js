import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

const PLACEHOLDER_PATTERN = /\{\{(\w+)\}\}/g;

/**
 * Scaffolds a new betal-fe project by copying a stack of template layers
 * into `targetDir`, in order:
 *
 *   base -> demo-<demo> -> router-<router> (if router !== 'none') -> deploy-<deploy> (if given)
 *
 * Every layer's files must land at a distinct path from every other layer's,
 * with exactly one deliberate exception: `src/main.js`. `base` provides a
 * working no-router default there; a `router-*` layer, if selected, replaces
 * it with one that constructs the chosen router and reuses the demo's own
 * `src/App.js` as the home route's component. Any other file collision
 * across layers is a bug in the templates, not a legitimate override, and
 * throws immediately rather than silently letting copy order decide the
 * winner.
 *
 * This function does no network access — `betalFeVersion`/`viteVersion`
 * must be resolved by the caller (see bin/index.js), so it stays a fast,
 * pure, easily-testable function.
 *
 * @param {Object} options
 * @param {string} options.targetDir - Absolute path to scaffold into. Must not exist, or must be empty.
 * @param {string} options.projectName - Used for package.json's name, index.html's <title>, etc.
 * @param {'counter'|'todo'} [options.demo='counter']
 * @param {'none'|'hash'|'browser'} [options.router='none']
 * @param {'vercel'|'netlify'|'nginx'|null} [options.deploy=null] - Only meaningful when router === 'browser'.
 * @param {string} options.betalFeVersion - e.g. "^4.5.0"
 * @param {string} options.viteVersion - e.g. "^7.2.4"
 * @param {boolean} [options.force=false] - Scaffold into a non-empty directory anyway, without throwing.
 * @returns {void}
 */
export function scaffold({
  targetDir,
  projectName,
  demo = 'counter',
  router = 'none',
  deploy = null,
  betalFeVersion,
  viteVersion,
  force = false,
}) {
  assertBetalFeVersion(betalFeVersion);
  assertViteVersion(viteVersion);
  if (!force) {
    assertTargetIsEmptyOrMissing(targetDir);
  }

  fs.mkdirSync(targetDir, { recursive: true });

  const layers = buildLayerList({ demo, router, deploy });
  const writtenBy = new Map(); // relative posix path -> layer name

  for (const layer of layers) {
    copyLayer(layer, targetDir, writtenBy);
  }

  substitutePlaceholders(targetDir, {
    PROJECT_NAME: projectName,
    BETAL_FE_VERSION: betalFeVersion,
    VITE_VERSION: viteVersion,
  });

  renameGitignoreTemplate(targetDir);
}

function assertBetalFeVersion(betalFeVersion) {
  if (!betalFeVersion) {
    throw new Error('scaffold() requires a betalFeVersion (e.g. "^4.5.0") — resolve it before calling scaffold().');
  }
}

function assertViteVersion(viteVersion) {
  if (!viteVersion) {
    throw new Error('scaffold() requires a viteVersion (e.g. "^7.2.4") — resolve it before calling scaffold().');
  }
}

function assertTargetIsEmptyOrMissing(targetDir) {
  if (!fs.existsSync(targetDir)) {
    return;
  }
  const entries = fs.readdirSync(targetDir);
  if (entries.length > 0) {
    throw new Error(`Target directory "${targetDir}" already exists and is not empty. Use --force to scaffold into it anyway.`);
  }
}

function buildLayerList({ demo, router, deploy }) {
  const layers = [
    { name: 'base', dir: path.join(TEMPLATES_DIR, 'base') },
    { name: `demo-${demo}`, dir: path.join(TEMPLATES_DIR, `demo-${demo}`) },
  ];

  if (router !== 'none') {
    layers.push({ name: `router-${router}`, dir: path.join(TEMPLATES_DIR, `router-${router}`) });
  }

  if (router === 'browser' && deploy && deploy !== 'manual') {
    layers.push({ name: `deploy-${deploy}`, dir: path.join(TEMPLATES_DIR, `deploy-${deploy}`) });
  }

  for (const layer of layers) {
    if (!fs.existsSync(layer.dir)) {
      throw new Error(`Unknown template layer "${layer.name}" — expected a directory at ${layer.dir}`);
    }
  }

  return layers;
}

// The deliberate override points — every other file collision across
// layers is a template bug, not a legitimate override. Each entry says
// which path can be overridden, and which layer prefix is allowed to do it:
//   - src/main.js: a router-* layer replaces base's no-router default with
//     one that constructs the chosen router and reuses the demo's App.js.
const OVERRIDABLE_PATHS = [
  { path: 'src/main.js', allowedFrom: (layerName) => layerName.startsWith('router-') },
];

function isOverridable(relativePath, layerName) {
  const rule = OVERRIDABLE_PATHS.find((r) => r.path === relativePath);
  return rule ? rule.allowedFrom(layerName) : false;
}

function copyLayer(layer, targetDir, writtenBy) {
  const files = listFilesRecursive(layer.dir);

  for (const relativePath of files) {
    const isOverride = isOverridable(relativePath, layer.name);
    const existingOwner = writtenBy.get(relativePath);

    if (existingOwner && !isOverride) {
      throw new Error(
        `Template collision: both "${existingOwner}" and "${layer.name}" provide "${relativePath}". ` +
        `Give one of them a different path, or add it to the deliberate-override list in scaffold.js if this is intentional.`
      );
    }

    const from = path.join(layer.dir, relativePath);
    const to = path.join(targetDir, relativePath);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
    writtenBy.set(relativePath, layer.name);
  }
}

function listFilesRecursive(dir, base = dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listFilesRecursive(full, base, out);
    } else {
      out.push(path.relative(base, full).split(path.sep).join('/'));
    }
  }
  return out;
}

function substitutePlaceholders(targetDir, values) {
  for (const relativePath of listFilesRecursive(targetDir)) {
    const filePath = path.join(targetDir, relativePath);
    const original = fs.readFileSync(filePath, 'utf-8');
    const replaced = original.replace(PLACEHOLDER_PATTERN, (match, key) => {
      if (!(key in values)) {
        throw new Error(`Unknown placeholder "{{${key}}}" in ${relativePath} — no value was provided for it.`);
      }
      return values[key];
    });
    if (replaced !== original) {
      fs.writeFileSync(filePath, replaced, 'utf-8');
    }
  }
}

function renameGitignoreTemplate(targetDir) {
  const from = path.join(targetDir, '_gitignore');
  if (fs.existsSync(from)) {
    fs.renameSync(from, path.join(targetDir, '.gitignore'));
  }
}
