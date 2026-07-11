import { describe, it, expect } from 'vitest'
import { resolveOptionsInteractively, VALID_TEMPLATES, VALID_ROUTERS, VALID_DEPLOYS } from '../src/prompts.js'

describe('resolveOptionsInteractively — flag validation (no prompts triggered when all flags are valid)', () => {
  it('accepts a fully-specified, valid set of flags without prompting', async () => {
    const result = await resolveOptionsInteractively({
      projectName: 'my-app',
      template: 'todo',
      router: 'browser',
      deploy: 'vercel',
    })

    expect(result).toEqual({ projectName: 'my-app', template: 'todo', router: 'browser', deploy: 'vercel' })
  })

  it('does not ask for deploy when router is not "browser"', async () => {
    const result = await resolveOptionsInteractively({
      projectName: 'my-app',
      template: 'counter',
      router: 'hash',
      deploy: null,
    })

    expect(result.deploy).toBeNull()
  })

  it('rejects an invalid --template value', async () => {
    await expect(resolveOptionsInteractively({
      projectName: 'my-app', template: 'bogus', router: 'none', deploy: null,
    })).rejects.toThrow(/Invalid --template "bogus"/)
  })

  it('rejects an invalid --router value', async () => {
    await expect(resolveOptionsInteractively({
      projectName: 'my-app', template: 'counter', router: 'bogus', deploy: null,
    })).rejects.toThrow(/Invalid --router "bogus"/)
  })

  it('rejects an invalid --deploy value', async () => {
    await expect(resolveOptionsInteractively({
      projectName: 'my-app', template: 'counter', router: 'browser', deploy: 'bogus',
    })).rejects.toThrow(/Invalid --deploy "bogus"/)
  })
})

describe('valid option lists', () => {
  it('exposes the exact template/router/deploy choices the CLI supports', () => {
    expect(VALID_TEMPLATES).toEqual(['counter', 'todo'])
    expect(VALID_ROUTERS).toEqual(['none', 'hash', 'browser'])
    expect(VALID_DEPLOYS).toEqual(['vercel', 'netlify', 'nginx', 'manual'])
  })
})
