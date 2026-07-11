import { describe, it, expect } from 'vitest'
import { parseArgs } from '../src/parse-args.js'

describe('parseArgs', () => {
  it('parses a positional project name', () => {
    expect(parseArgs(['my-app']).projectName).toBe('my-app')
  })

  it('parses "--flag value" form', () => {
    const result = parseArgs(['my-app', '--template', 'todo', '--router', 'browser'])
    expect(result.template).toBe('todo')
    expect(result.router).toBe('browser')
  })

  it('parses "--flag=value" form', () => {
    const result = parseArgs(['my-app', '--template=todo', '--deploy=vercel'])
    expect(result.template).toBe('todo')
    expect(result.deploy).toBe('vercel')
  })

  it('parses the boolean --force flag', () => {
    expect(parseArgs(['my-app', '--force']).force).toBe(true)
    expect(parseArgs(['my-app']).force).toBe(false)
  })

  it('defaults unset flags to null', () => {
    const result = parseArgs(['my-app'])
    expect(result.template).toBeNull()
    expect(result.router).toBeNull()
    expect(result.deploy).toBeNull()
  })

  it('throws on an unknown flag', () => {
    expect(() => parseArgs(['my-app', '--bogus', 'x'])).toThrow(/Unknown flag/)
  })

  it('throws when a flag is missing its value', () => {
    expect(() => parseArgs(['my-app', '--template'])).toThrow(/needs a value/)
  })

  it('works with no arguments at all', () => {
    const result = parseArgs([])
    expect(result.projectName).toBeNull()
    expect(result.force).toBe(false)
  })
})
