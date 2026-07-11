import { describe, it, expect, vi, afterEach } from 'vitest'
import { resolveLatestVersion } from '../src/resolve-versions.js'

afterEach(() => {
  vi.restoreAllMocks()
  delete global.fetch
})

describe('resolveLatestVersion', () => {
  it('returns "^<latest>" from a successful registry response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ 'dist-tags': { latest: '4.5.0' } }),
    })

    const version = await resolveLatestVersion('betal-fe', '^0.0.0')

    expect(version).toBe('^4.5.0')
  })

  it('falls back when the registry response is not ok', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 })

    const version = await resolveLatestVersion('betal-fe', '^4.5.0')

    expect(version).toBe('^4.5.0')
    expect(warn).toHaveBeenCalled()
  })

  it('falls back when fetch itself rejects (offline)', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    global.fetch = vi.fn().mockRejectedValue(new Error('network unreachable'))

    const version = await resolveLatestVersion('vite', '^7.2.4')

    expect(version).toBe('^7.2.4')
  })

  it('falls back when the registry response has no dist-tags.latest', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) })

    const version = await resolveLatestVersion('betal-fe', '^4.5.0')

    expect(version).toBe('^4.5.0')
  })
})
