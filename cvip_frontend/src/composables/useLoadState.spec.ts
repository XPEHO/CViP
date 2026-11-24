import { describe, expect, it } from 'vitest'
import { useLoadState } from './useLoadState'

describe('useLoadState', () => {
  it('remplit data après un chargement réussi', async () => {
    const state = useLoadState(async () => 42)

    const pending = state.load()
    expect(state.loading.value).toBe(true)
    await pending

    expect(state.data.value).toBe(42)
    expect(state.error.value).toBeNull()
    expect(state.loading.value).toBe(false)
  })

  it('remplit error sans lever quand l’appel échoue', async () => {
    const failure = new Error('boom')
    const state = useLoadState(async () => {
      throw failure
    })

    await state.load()

    expect(state.error.value).toBe(failure)
    expect(state.data.value).toBeNull()
    expect(state.loading.value).toBe(false)
  })

  it('efface l’erreur précédente au rechargement', async () => {
    let fail = true
    const state = useLoadState(async () => {
      if (fail) throw new Error('boom')
      return 'ok'
    })

    await state.load()
    fail = false
    await state.load()

    expect(state.error.value).toBeNull()
    expect(state.data.value).toBe('ok')
  })
})
