import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { scaffold } from '../src/scaffold.js'

let scratchRoot

beforeEach(() => {
  scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'create-betal-app-test-'))
})

afterEach(() => {
  fs.rmSync(scratchRoot, { recursive: true, force: true })
})

function target(name = 'my-app') {
  return path.join(scratchRoot, name)
}

const versions = { betalFeVersion: '^4.5.0', viteVersion: '^7.2.4' }

describe('scaffold — base + demo-counter (no router)', () => {
  it('creates the expected file tree', () => {
    scaffold({ targetDir: target(), projectName: 'my-app', demo: 'counter', router: 'none', ...versions })

    const files = ['package.json', 'index.html', '.gitignore', 'README.md', 'src/index.css', 'src/main.js', 'src/App.js']
    for (const f of files) {
      expect(fs.existsSync(path.join(target(), f)), `expected ${f} to exist`).toBe(true)
    }
  })

  it('substitutes PROJECT_NAME in package.json and index.html', () => {
    scaffold({ targetDir: target(), projectName: 'my-cool-app', demo: 'counter', router: 'none', ...versions })

    const pkg = JSON.parse(fs.readFileSync(path.join(target(), 'package.json'), 'utf-8'))
    expect(pkg.name).toBe('my-cool-app')

    const html = fs.readFileSync(path.join(target(), 'index.html'), 'utf-8')
    expect(html).toContain('<title>my-cool-app</title>')
  })

  it('pins the given betal-fe and vite versions', () => {
    scaffold({ targetDir: target(), projectName: 'my-app', demo: 'counter', router: 'none', betalFeVersion: '^9.9.9', viteVersion: '^1.2.3' })

    const pkg = JSON.parse(fs.readFileSync(path.join(target(), 'package.json'), 'utf-8'))
    expect(pkg.dependencies['betal-fe']).toBe('^9.9.9')
    expect(pkg.devDependencies.vite).toBe('^1.2.3')
  })

  it('generates a real, valid .gitignore (not a leftover _gitignore template file)', () => {
    scaffold({ targetDir: target(), projectName: 'my-app', demo: 'counter', router: 'none', ...versions })

    expect(fs.existsSync(path.join(target(), '.gitignore'))).toBe(true)
    expect(fs.existsSync(path.join(target(), '_gitignore'))).toBe(false)
  })

  it('leaves no unresolved {{PLACEHOLDER}} tokens in any generated file', () => {
    scaffold({ targetDir: target(), projectName: 'my-app', demo: 'counter', router: 'none', ...versions })

    const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]
    )
    for (const file of walk(target())) {
      const content = fs.readFileSync(file, 'utf-8')
      expect(content, `unresolved placeholder in ${file}`).not.toMatch(/\{\{\w+\}\}/)
    }
  })

  it('generated package.json has real build and preview scripts, not just dev', () => {
    scaffold({ targetDir: target(), projectName: 'my-app', demo: 'counter', router: 'none', ...versions })

    const pkg = JSON.parse(fs.readFileSync(path.join(target(), 'package.json'), 'utf-8'))
    expect(pkg.scripts.dev).toBe('vite')
    expect(pkg.scripts.build).toBe('vite build')
    expect(pkg.scripts.preview).toBe('vite preview')
  })
})

describe('scaffold — router: hash', () => {
  it('overrides main.js with the router-wired version, not a collision error', () => {
    expect(() => scaffold({ targetDir: target(), projectName: 'my-app', demo: 'counter', router: 'hash', ...versions }))
      .not.toThrow()

    const mainJs = fs.readFileSync(path.join(target(), 'src/main.js'), 'utf-8')
    expect(mainJs).toContain('HashRouter')
    expect(mainJs).not.toContain("import App from './App.js'") // that's the no-router base variant
  })

  it('includes the extra AboutPage contributed by the router layer', () => {
    scaffold({ targetDir: target(), projectName: 'my-app', demo: 'counter', router: 'hash', ...versions })

    expect(fs.existsSync(path.join(target(), 'src/AboutPage.js'))).toBe(true)
  })

  it('still includes the demo\'s own App.js, reused as the home route', () => {
    scaffold({ targetDir: target(), projectName: 'my-app', demo: 'counter', router: 'hash', ...versions })

    expect(fs.existsSync(path.join(target(), 'src/App.js'))).toBe(true)
    const mainJs = fs.readFileSync(path.join(target(), 'src/main.js'), 'utf-8')
    expect(mainJs).toContain("from './App.js'")
  })

  it('does not include any deploy config — hash routing has nothing to work around', () => {
    scaffold({ targetDir: target(), projectName: 'my-app', demo: 'counter', router: 'hash', ...versions })

    expect(fs.existsSync(path.join(target(), 'vercel.json'))).toBe(false)
    expect(fs.existsSync(path.join(target(), 'public/_redirects'))).toBe(false)
    expect(fs.existsSync(path.join(target(), 'deploy'))).toBe(false)
  })
})

describe('scaffold — router: browser', () => {
  it('wires BrowserRouter and includes DEPLOYING.md', () => {
    scaffold({ targetDir: target(), projectName: 'my-app', demo: 'counter', router: 'browser', ...versions })

    const mainJs = fs.readFileSync(path.join(target(), 'src/main.js'), 'utf-8')
    expect(mainJs).toContain('BrowserRouter')
    expect(fs.existsSync(path.join(target(), 'DEPLOYING.md'))).toBe(true)
  })

  it('deploy: vercel puts vercel.json at the PROJECT ROOT, not a subfolder', () => {
    scaffold({ targetDir: target(), projectName: 'my-app', demo: 'counter', router: 'browser', deploy: 'vercel', ...versions })

    expect(fs.existsSync(path.join(target(), 'vercel.json'))).toBe(true)
    expect(fs.existsSync(path.join(target(), 'deploy/vercel.json'))).toBe(false)

    const config = JSON.parse(fs.readFileSync(path.join(target(), 'vercel.json'), 'utf-8'))
    expect(config.rewrites[0].destination).toBe('/index.html')
  })

  it('deploy: netlify puts _redirects in public/, so Vite copies it into dist/', () => {
    scaffold({ targetDir: target(), projectName: 'my-app', demo: 'counter', router: 'browser', deploy: 'netlify', ...versions })

    expect(fs.existsSync(path.join(target(), 'public/_redirects'))).toBe(true)
    const content = fs.readFileSync(path.join(target(), 'public/_redirects'), 'utf-8')
    expect(content).toContain('/index.html')
  })

  it('deploy: nginx puts the snippet under deploy/ — always manually applied regardless of location', () => {
    scaffold({ targetDir: target(), projectName: 'my-app', demo: 'counter', router: 'browser', deploy: 'nginx', ...versions })

    expect(fs.existsSync(path.join(target(), 'deploy/nginx.conf.snippet'))).toBe(true)
  })

  it('deploy: manual (or omitted) includes no deploy config files at all', () => {
    scaffold({ targetDir: target(), projectName: 'my-app', demo: 'counter', router: 'browser', deploy: 'manual', ...versions })

    expect(fs.existsSync(path.join(target(), 'vercel.json'))).toBe(false)
    expect(fs.existsSync(path.join(target(), 'public/_redirects'))).toBe(false)
    expect(fs.existsSync(path.join(target(), 'deploy'))).toBe(false)
  })
})

describe('scaffold — demo: todo', () => {
  it('uses base\'s index.html unchanged (no CDN dependency needed)', () => {
    expect(() => scaffold({ targetDir: target(), projectName: 'my-app', demo: 'todo', router: 'none', ...versions }))
      .not.toThrow()

    const html = fs.readFileSync(path.join(target(), 'index.html'), 'utf-8')
    expect(html).toContain('<title>my-app</title>')
    expect(html).not.toContain('cdn.tailwindcss.com')
  })

  it('composes correctly with a router selected too', () => {
    scaffold({ targetDir: target(), projectName: 'my-app', demo: 'todo', router: 'hash', ...versions })

    const mainJs = fs.readFileSync(path.join(target(), 'src/main.js'), 'utf-8')
    expect(mainJs).toContain('HashRouter')

    expect(fs.existsSync(path.join(target(), 'src/App.js'))).toBe(true)
  })
})

describe('scaffold — safety checks', () => {
  it('refuses to scaffold into a non-empty directory', () => {
    fs.mkdirSync(target(), { recursive: true })
    fs.writeFileSync(path.join(target(), 'existing-file.txt'), 'hello')

    expect(() => scaffold({ targetDir: target(), projectName: 'my-app', ...versions })).toThrow(/not empty/)
  })

  it('scaffolds into a non-empty directory anyway when force is true', () => {
    fs.mkdirSync(target(), { recursive: true })
    fs.writeFileSync(path.join(target(), 'existing-file.txt'), 'hello')

    expect(() => scaffold({ targetDir: target(), projectName: 'my-app', force: true, ...versions })).not.toThrow()
    expect(fs.existsSync(path.join(target(), 'package.json'))).toBe(true)
    expect(fs.existsSync(path.join(target(), 'existing-file.txt'))).toBe(true)
  })

  it('succeeds scaffolding into a directory that exists but is empty', () => {
    fs.mkdirSync(target(), { recursive: true })

    expect(() => scaffold({ targetDir: target(), projectName: 'my-app', ...versions })).not.toThrow()
  })

  it('throws a clear error for an unknown demo name', () => {
    expect(() => scaffold({ targetDir: target(), projectName: 'my-app', demo: 'nonexistent', ...versions }))
      .toThrow(/Unknown template layer "demo-nonexistent"/)
  })

  it('throws if betalFeVersion is not provided', () => {
    expect(() => scaffold({ targetDir: target(), projectName: 'my-app', viteVersion: '^7.2.4' }))
      .toThrow(/betalFeVersion/)
  })
})
