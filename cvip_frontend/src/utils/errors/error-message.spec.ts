import { describe, expect, it } from 'vitest'
import { ApiError } from '@/api/core/api-error'
import { errorMessage } from './error-message'

describe('errorMessage', () => {
  it('utilise le texte du client pour un code connu', () => {
    expect(errorMessage(new ApiError('NETWORK_ERROR', 0, 'brut'))).toBe(
      'Le serveur est injoignable.',
    )
  })

  it('reprend le message du serveur pour les autres codes', () => {
    expect(errorMessage(new ApiError('SKILL_DISABLED', 409, 'La compétence est désactivée'))).toBe(
      'La compétence est désactivée',
    )
  })

  it('renvoie un texte générique pour une erreur qui n’est pas une ApiError', () => {
    expect(errorMessage(new TypeError('x'))).toBe('Une erreur inattendue est survenue.')
    expect(errorMessage(null)).toBe('Une erreur inattendue est survenue.')
  })
})
