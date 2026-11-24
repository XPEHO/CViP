import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import HomeView from './HomeView.vue'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('HomeView', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('affiche le titre et annonce la vérification en cours', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => undefined))

    const wrapper = mount(HomeView)

    expect(wrapper.get('h1').text()).toBe('CViP')
    expect(wrapper.get('output').text()).toContain('Vérification')
  })

  it('indique que l’API et la base sont disponibles', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ status: 'ok', db: 'connected' }))

    const wrapper = mount(HomeView)
    await flushPromises()

    expect(wrapper.get('output').text()).toBe('API et base de données disponibles.')
  })

  it('indique une base injoignable', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ status: 'degraded', db: 'unavailable' }, 503),
    )

    const wrapper = mount(HomeView)
    await flushPromises()

    expect(wrapper.get('output').text()).toContain('base de données injoignable')
  })

  it('indique une API injoignable', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'))

    const wrapper = mount(HomeView)
    await flushPromises()

    expect(wrapper.get('output').text()).toBe('Le serveur est injoignable.')
  })
})
