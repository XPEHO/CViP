import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HelloWorld from '../HelloWorld.vue'

describe('HelloWorld', () => {
  it('affiche le message reçu en prop', () => {
    const wrapper = mount(HelloWorld, { props: { msg: 'Bonjour' } })
    expect(wrapper.text()).toContain('Bonjour')
  })
})
