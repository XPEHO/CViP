import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ApiStatus from './ApiStatus.vue'

describe('ApiStatus', () => {
  it('annonce la vérification tant que l’état est inconnu', () => {
    const wrapper = mount(ApiStatus, { props: { health: null, error: null } })

    expect(wrapper.get('output').text()).toBe("Vérification de l'API…")
  })

  it('indique que tout est disponible', () => {
    const wrapper = mount(ApiStatus, {
      props: { health: { status: 'ok', db: 'connected' }, error: null },
    })

    expect(wrapper.text()).toBe('API et base de données disponibles.')
  })

  it('indique une base injoignable', () => {
    const wrapper = mount(ApiStatus, {
      props: { health: { status: 'degraded', db: 'unavailable' }, error: null },
    })

    expect(wrapper.text()).toBe('API disponible, base de données injoignable.')
  })

  it('affiche l’erreur en priorité', () => {
    const wrapper = mount(ApiStatus, {
      props: { health: { status: 'ok', db: 'connected' }, error: 'Le serveur est injoignable.' },
    })

    expect(wrapper.text()).toBe('Le serveur est injoignable.')
  })
})
