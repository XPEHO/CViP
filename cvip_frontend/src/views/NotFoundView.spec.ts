import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import NotFoundView from './NotFoundView.vue'
import { RouteName } from '@/router/route-name'

describe('NotFoundView', () => {
  it('annonce la page introuvable et propose de revenir à l’accueil', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', name: RouteName.Home, component: { template: '<p />' } }],
    })

    const wrapper = mount(NotFoundView, { global: { plugins: [router] } })

    expect(wrapper.get('h1').text()).toBe('Page introuvable')
    expect(wrapper.get('a').attributes('href')).toBe('/')
  })
})
