import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import http from 'node:http'
import { execFileSync } from 'node:child_process'
import { scaffold } from '../src/scaffold.js'

// This is the one test that proves *why* the deploy config matters, not just
// that the file exists: build a real scaffolded BrowserRouter project, serve
// its real dist/ output two ways — once as a plain static file server (no
// fallback, simulating a host with no rewrite rule configured) and once with
// an SPA fallback (simulating what vercel.json/_redirects tells the real
// platform to do) — and confirm a nested route 404s in the first case and
// serves the app shell in the second.
//
// Runs a real `npm install` + `npm run build`, so it's slow; only run when
// explicitly asked (not part of the default fast test run).

const RUN_SLOW = process.env.CBA_RUN_SLOW_TESTS === '1'
const describeSlow = RUN_SLOW ? describe : describe.skip

describeSlow('BrowserRouter deployment config — proves the failure mode, not just file existence', () => {
  let projectDir
  let distDir

  beforeAll(() => {
    const scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cba-deploy-fallback-'))
    projectDir = path.join(scratchRoot, 'my-app')

    scaffold({
      targetDir: projectDir,
      projectName: 'my-app',
      demo: 'counter',
      router: 'browser',
      deploy: 'vercel',
      betalFeVersion: '^4.5.0',
      viteVersion: '^7.2.4',
    })

    const runtimePath = path.resolve(__dirname, '..', '..', 'runtime')
    execFileSync('npm', ['install', `betal-fe@file:${runtimePath}`, 'vite@^7.2.4'], { cwd: projectDir, stdio: 'pipe', shell: true })
    execFileSync('npm', ['run', 'build'], { cwd: projectDir, stdio: 'pipe', shell: true })

    distDir = path.join(projectDir, 'dist')
  }, 120_000)

  afterAll(() => {
    if (projectDir) fs.rmSync(path.dirname(projectDir), { recursive: true, force: true })
  })

  function serveDist({ withFallback }) {
    const server = http.createServer((req, res) => {
      const requestedPath = path.join(distDir, decodeURIComponent(req.url.split('?')[0]));
      const exists = fs.existsSync(requestedPath) && fs.statSync(requestedPath).isFile();

      if (exists) {
        res.writeHead(200);
        res.end(fs.readFileSync(requestedPath));
        return;
      }

      if (withFallback) {
        res.writeHead(200, { 'content-type': 'text/html' });
        res.end(fs.readFileSync(path.join(distDir, 'index.html')));
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });
    return new Promise((resolve) => server.listen(0, () => resolve(server)));
  }

  async function requestPath(server, urlPath) {
    const { port } = server.address();
    const response = await fetch(`http://localhost:${port}${urlPath}`);
    return { status: response.status, body: await response.text() };
  }

  it('404s on a nested route with no fallback configured — the bug this feature exists to prevent', async () => {
    const server = await serveDist({ withFallback: false });
    try {
      const { status } = await requestPath(server, '/about');
      expect(status).toBe(404);
    } finally {
      server.close();
    }
  });

  it('serves the app shell for the same nested route once the fallback is honored', async () => {
    const server = await serveDist({ withFallback: true });
    try {
      const { status, body } = await requestPath(server, '/about');
      expect(status).toBe(200);
      expect(body).toContain('<div id="app">');
    } finally {
      server.close();
    }
  });

  it('the real vercel.json this project was scaffolded with encodes exactly that fallback rule', () => {
    const config = JSON.parse(fs.readFileSync(path.join(projectDir, 'vercel.json'), 'utf-8'));
    expect(config.rewrites).toEqual([{ source: '/(.*)', destination: '/index.html' }]);
  });
});
