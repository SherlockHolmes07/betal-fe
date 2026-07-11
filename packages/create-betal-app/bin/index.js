#!/usr/bin/env node
import path from 'node:path';
import * as clack from '@clack/prompts';
import { parseArgs } from '../src/parse-args.js';
import { resolveOptionsInteractively, PromptCancelledError } from '../src/prompts.js';
import { resolveBetalFeVersion, resolveViteVersion } from '../src/resolve-versions.js';
import { scaffold } from '../src/scaffold.js';

async function main() {
  const parsed = parseArgs(process.argv.slice(2));

  const { projectName, template, router, deploy } = await resolveOptionsInteractively(parsed);
  const targetDir = path.resolve(process.cwd(), projectName);

  const spinner = clack.spinner();
  spinner.start('Resolving package versions');
  const [betalFeVersion, viteVersion] = await Promise.all([
    resolveBetalFeVersion(),
    resolveViteVersion(),
  ]);
  spinner.stop('Package versions resolved');

  scaffold({
    targetDir,
    projectName,
    demo: template,
    router,
    deploy,
    betalFeVersion,
    viteVersion,
    force: parsed.force,
  });

  printNextSteps({ projectName, router, deploy });
}

function printNextSteps({ projectName, router, deploy }) {
  clack.log.success(`Scaffolded "${projectName}".`);

  const lines = [
    `cd ${projectName}`,
    'npm install',
    'npm run dev',
  ];
  clack.note(lines.join('\n'), 'Next steps');

  if (router === 'browser') {
    if (deploy && deploy !== 'manual') {
      clack.log.info(`BrowserRouter needs a server rewrite rule to survive a page refresh — the ${deploy} config for that is already in the project. See DEPLOYING.md for details.`);
    } else {
      clack.log.warn('BrowserRouter needs a server rewrite rule to survive a page refresh in production — see DEPLOYING.md for how to set that up for your host.');
    }
  }
}

main().catch((error) => {
  if (error instanceof PromptCancelledError) {
    process.exit(1);
  }
  console.error(`[create-betal-app] ${error.message}`);
  process.exit(1);
});
