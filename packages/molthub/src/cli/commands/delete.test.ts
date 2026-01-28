/* @vitest-environment node */

import { afterEach, describe, expect, it, vi } from 'vitest'
import type { GlobalOpts } from '../types'

vi.mock('../../config.js', () => ({
  readGlobalConfig: vi.fn(async () => ({ registry: 'https://molthub.com', token: 'tkn' })),
}))

vi.mock('../registry.js', () => ({
  getRegistry: vi.fn(async () => 'https://molthub.com'),
}))

const mockApiRequest = vi.fn()
vi.mock('../../http.js', () => ({
  apiRequest: (registry: unknown, args: unknown, schema?: unknown) =>
    mockApiRequest(registry, args, schema),
}))

const mockFail = vi.fn((message: string) => {
  throw new Error(message)
})

vi.mock('../ui.js', () => ({
  createSpinner: vi.fn(() => ({ succeed: vi.fn(), fail: vi.fn() })),
  fail: (message: string) => mockFail(message),
  formatError: (error: unknown) => (error instanceof Error ? error.message : String(error)),
  isInteractive: () => false,
  promptConfirm: vi.fn(async () => true),
}))

const { cmdDeleteSkill, cmdUndeleteSkill } = await import('./delete')

function makeOpts(): GlobalOpts {
  return {
    workdir: '/work',
    dir: '/work/skills',
    site: 'https://molthub.com',
    registry: 'https://molthub.com',
    registrySource: 'default',
  }
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('delete/undelete', () => {
  it('requires --yes when input is disabled', async () => {
    await expect(cmdDeleteSkill(makeOpts(), 'demo', {}, false)).rejects.toThrow(/--yes/i)
    await expect(cmdUndeleteSkill(makeOpts(), 'demo', {}, false)).rejects.toThrow(/--yes/i)
  })

  it('calls delete endpoint with --yes', async () => {
    mockApiRequest.mockResolvedValueOnce({ ok: true })
    await cmdDeleteSkill(makeOpts(), 'demo', { yes: true }, false)
    expect(mockApiRequest).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ method: 'DELETE', path: '/api/v1/skills/demo' }),
      expect.anything(),
    )
  })

  it('calls undelete endpoint with --yes', async () => {
    mockApiRequest.mockResolvedValueOnce({ ok: true })
    await cmdUndeleteSkill(makeOpts(), 'demo', { yes: true }, false)
    expect(mockApiRequest).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ method: 'POST', path: '/api/v1/skills/demo/undelete' }),
      expect.anything(),
    )
  })
})
