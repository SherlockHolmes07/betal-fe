const KNOWN_FLAGS = new Set(["template", "router", "deploy", "force"]);

/**
 * Minimal flag parser for this CLI's small, fixed set of options — avoids
 * node:util's parseArgs (only stabilized in Node 20; this package supports
 * Node >=18) and avoids a dependency for something this small.
 *
 * Supports `--flag value` and `--flag=value`, plus a single positional
 * argument (the project name/directory). `--force` is boolean (no value).
 *
 * @param {string[]} argv - Typically `process.argv.slice(2)`.
 * @returns {{projectName: string|null, template: string|null, router: string|null, deploy: string|null, force: boolean}}
 */
export function parseArgs(argv) {
  const result = {
    projectName: null,
    template: null,
    router: null,
    deploy: null,
    force: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "--force") {
      result.force = true;
      continue;
    }

    if (arg.startsWith("--")) {
      const [flagPart, inlineValue] = arg.slice(2).split(/=(.*)/s);
      if (!KNOWN_FLAGS.has(flagPart)) {
        throw new Error(`Unknown flag "--${flagPart}"`);
      }
      const value = inlineValue !== undefined ? inlineValue : argv[++i];
      if (value === undefined) {
        throw new Error(`Flag "--${flagPart}" needs a value`);
      }
      result[flagPart] = value;
      continue;
    }

    if (result.projectName === null) {
      result.projectName = arg;
    }
  }

  return result;
}
