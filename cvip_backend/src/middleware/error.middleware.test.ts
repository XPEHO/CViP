import { mock, test } from 'node:test'
import assert from 'node:assert/strict'
import type { NextFunction } from 'express'
import { asResponse, fakeReq, fakeRes } from '../test-utils/http.ts'
import { ApiError } from '../utils/api-error.ts'
import { handleError, handleNotFound, toApiError } from './error.middleware.ts'

const next: NextFunction = () => {}

test('toApiError traduit les erreurs PostgreSQL, brutes ou enveloppées par TypeORM', () => {
  assert.equal(toApiError({ code: '23503' })?.code, 'REFERENCED_OR_MISSING')
  assert.equal(toApiError({ driverError: { code: '23514' } })?.code, 'VALIDATION_ERROR')
  assert.equal(toApiError({ code: '22P02' })?.code, 'VALIDATION_ERROR')
})

test('toApiError traduit les erreurs de lecture du corps', () => {
  assert.equal(toApiError({ status: 413, expose: true })?.code, 'PAYLOAD_TOO_LARGE')
  assert.equal(toApiError({ status: 400, expose: true })?.code, 'BAD_REQUEST')
})

test('toApiError renvoie null pour une erreur inattendue', () => {
  assert.equal(toApiError(new Error('boum')), null)
  assert.equal(toApiError('texte'), null)
  assert.equal(toApiError({ status: 500, expose: false }), null)
})

test('handleNotFound transmet une erreur NOT_FOUND', () => {
  const forward = mock.fn()
  handleNotFound(fakeReq(), asResponse(fakeRes()), forward as unknown as NextFunction)
  const err = forward.mock.calls[0]?.arguments[0] as ApiError
  assert.equal(err.code, 'NOT_FOUND')
  assert.equal(err.message, 'Route introuvable')
})

test('handleError répond avec le code et le statut de l’erreur connue', () => {
  const res = fakeRes()
  handleError(new ApiError('VALIDATION_ERROR', 'invalide'), fakeReq(), asResponse(res), next)
  assert.equal(res.statusCode, 400)
  assert.deepEqual(res.body, { code: 'VALIDATION_ERROR', message: 'invalide' })
})

test('handleError journalise une erreur inattendue et masque le détail', (t) => {
  const log = t.mock.method(console, 'error', () => {})
  const res = fakeRes()
  handleError(new Error('secret interne'), fakeReq(), asResponse(res), next)
  assert.equal(res.statusCode, 500)
  assert.deepEqual(res.body, { code: 'INTERNAL_ERROR', message: 'Erreur interne du serveur' })
  assert.equal(log.mock.callCount(), 1)
})
