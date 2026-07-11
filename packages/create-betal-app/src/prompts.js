import * as clack from "@clack/prompts";

export const VALID_TEMPLATES = ["counter", "todo"];
export const VALID_ROUTERS = ["none", "hash", "browser"];
export const VALID_DEPLOYS = ["vercel", "netlify", "nginx", "manual"];

/** Thrown when the user cancels an interactive prompt (Ctrl+C, Esc). */
export class PromptCancelledError extends Error {
  constructor() {
    super("Cancelled.");
    this.name = "PromptCancelledError";
  }
}

function unwrap(value) {
  if (clack.isCancel(value)) {
    clack.cancel("Cancelled.");
    throw new PromptCancelledError();
  }
  return value;
}

/**
 * Fills in whatever `parsed` (from parseArgs) didn't already supply via
 * flags, by prompting interactively. Flags always win — a prompt is only
 * shown for a field that's still `null`. `deploy` is only ever prompted
 * when the resolved router is `'browser'` (nothing to configure otherwise).
 *
 * @param {{projectName: string|null, template: string|null, router: string|null, deploy: string|null}} parsed
 * @returns {Promise<{projectName: string, template: string, router: string, deploy: string|null}>}
 */
export async function resolveOptionsInteractively(parsed) {
  clack.intro("create-betal-app");

  const projectName =
    parsed.projectName ??
    unwrap(
      await clack.text({
        message: "Project name?",
        placeholder: "my-betal-app",
        validate: (value) =>
          value.trim() === "" ? "Project name cannot be empty." : undefined,
      }),
    );

  const template =
    validateChoice("template", parsed.template, VALID_TEMPLATES) ??
    unwrap(
      await clack.select({
        message: "Which starter?",
        options: [
          { value: "counter", label: "Counter", hint: "minimal starter" },
          { value: "todo", label: "Todo app", hint: "fuller-featured demo" },
        ],
      }),
    );

  const router =
    validateChoice("router", parsed.router, VALID_ROUTERS) ??
    unwrap(
      await clack.select({
        message: "Router?",
        options: [
          { value: "none", label: "None" },
          {
            value: "hash",
            label: "HashRouter",
            hint: "#/path — works anywhere, zero server config",
          },
          {
            value: "browser",
            label: "BrowserRouter",
            hint: "/path — needs a deployment rewrite rule, see below",
          },
        ],
      }),
    );

  let deploy = null;
  if (router === "browser") {
    deploy =
      validateChoice("deploy", parsed.deploy, VALID_DEPLOYS) ??
      unwrap(
        await clack.select({
          message:
            "Where will this deploy? (BrowserRouter needs a rewrite rule to survive a page refresh)",
          options: [
            { value: "vercel", label: "Vercel" },
            { value: "netlify", label: "Netlify" },
            { value: "nginx", label: "nginx (self-hosted)" },
            {
              value: "manual",
              label: "I'll configure it myself",
              hint: "see DEPLOYING.md in the generated project",
            },
          ],
        }),
      );
  }

  clack.outro("Scaffolding...");

  return { projectName, template, router, deploy };
}

function validateChoice(flagName, value, validValues) {
  if (value === null) return null;
  if (!validValues.includes(value)) {
    throw new Error(
      `Invalid --${flagName} "${value}" — expected one of: ${validValues.join(", ")}`,
    );
  }
  return value;
}
