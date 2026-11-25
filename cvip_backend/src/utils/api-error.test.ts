import { test } from 'node:test'
import assert from 'node:assert/strict'
import { asResponse, fakeRes } from '../test-utils/http.ts'
import { ApiError, sendError, statusOf, validationError } from './api-error.ts'

test('statusOf associe un statut à chaque famille de code', () => {
  assert.equal(statusOf('VALIDATION_ERROR'), 400)
  assert.equal(statusOf('PAYLOAD_TOO_LARGE'), 413)
  assert.equal(statusOf('NOT_FOUND'), 404)
  assert.equal(statusOf('SKILL_NOT_FOUND'), 404)
  assert.equal(statusOf('SECTOR_NOT_FOUND'), 404)
  assert.equal(statusOf('SKILL_DUPLICATE'), 409)
  assert.equal(statusOf('SKILL_TARGET_MERGED'), 409)
  assert.equal(statusOf('REFERENCED_OR_MISSING'), 409)
  assert.equal(statusOf('INTERNAL_ERROR'), 500)
})

test('validationError produit VALIDATION_ERROR', () => {
  const err = validationError('name est obligatoire', { champ: 'name' })
  assert.ok(err instanceof ApiError)
  assert.equal(err.code, 'VALIDATION_ERROR')
  assert.equal(err.message, 'name est obligatoire')
  assert.deepEqual(err.details, { champ: 'name' })
})

test('sendError écrit le statut et le corps { code, message }', () => {
  const res = fakeRes()
  sendError(asResponse(res), 'SKILL_NOT_FOUND', 'Élément introuvable')
  assert.equal(res.statusCode, 404)
  assert.deepEqual(res.body, { code: 'SKILL_NOT_FOUND', message: 'Élément introuvable' })
})

test('sendError ajoute details seulement lorsqu’il est fourni', () => {
  const res = fakeRes()
  sendError(asResponse(res), 'VALIDATION_ERROR', 'invalide', ['a'])
  assert.deepEqual(res.body, { code: 'VALIDATION_ERROR', message: 'invalide', details: ['a'] })
})
