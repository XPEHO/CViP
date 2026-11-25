import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getHealth } from './health.api'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('getHealth', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renvoie l’état quand la base répond', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ status: 'ok', db: 'connected' }))

    expect(await getHealth()).toEqual({ status: 'ok', db: 'connected' })
    expect(fetch).toHaveBeenCalledWith('/api/health', expect.anything())
  })

  it('renvoie degraded sur un 503 au lieu de lever', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ status: 'degraded', db: 'unavailable' }, 503),
    )

    expect(await getHealth()).toEqual({ status: 'degraded', db: 'unavailable' })
  })

  it('relance les autres erreurs', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(getHealth()).rejects.toMatchObject({ code: 'NETWORK_ERROR' })
  })
})
