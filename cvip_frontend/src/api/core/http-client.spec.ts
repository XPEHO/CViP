import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './api-error'
import { request } from './http-client'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('http-client request', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('envoie la requête sur /api<chemin> avec un en-tête JSON', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ ok: true }))

    await request('/skills', { method: 'POST', body: '{}' })

    expect(fetch).toHaveBeenCalledWith(
      '/api/skills',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    )
  })

  it('renvoie le corps JSON d’une réponse 2xx', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse([{ id: 'a' }]))

    expect(await request<{ id: string }[]>('/skills')).toEqual([{ id: 'a' }])
  })

  it('renvoie undefined pour une réponse 204', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }))

    expect(await request('/skills/a', { method: 'DELETE' })).toBeUndefined()
  })

  it('convertit un corps d’erreur du backend en ApiError (code, statut, message, détails)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ code: 'SKILL_DISABLED', message: 'Désactivée', details: { id: 'a' } }, 409),
    )

    const error = await request('/skills/resolve').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      code: 'SKILL_DISABLED',
      status: 409,
      message: 'Désactivée',
      details: { id: 'a' },
    })
  })

  it('renvoie INTERNAL_ERROR quand la réponse d’erreur n’est pas du JSON', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response('<html>Bad gateway</html>', { status: 502 }),
    )

    await expect(request('/skills')).rejects.toMatchObject({ code: 'INTERNAL_ERROR', status: 502 })
  })

  it('renvoie NETWORK_ERROR quand le serveur ne répond pas', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(request('/skills')).rejects.toMatchObject({ code: 'NETWORK_ERROR', status: 0 })
  })
})
