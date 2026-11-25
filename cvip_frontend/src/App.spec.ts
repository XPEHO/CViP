import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from './App.vue'
import { RouteName } from './router/route-name'

describe('App', () => {
  it('affiche le lien d’évitement, l’en-tête et la vue courante dans le repère main', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', name: RouteName.Home, component: { template: '<p>vue</p>' } }],
    })
    await router.push('/')
    await router.isReady()

    const wrapper = mount(App, { global: { plugins: [router] } })

    expect(wrapper.get('a.skip-link').attributes('href')).toBe('#contenu')
    expect(wrapper.get('header').text()).toBe('CViP')
    expect(wrapper.get('main#contenu').text()).toBe('vue')
  })
})
