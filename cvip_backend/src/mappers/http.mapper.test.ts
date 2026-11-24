import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { fakeReq } from '../test-utils/http.ts'
import { ApiError } from '../utils/api-error.ts'
import {
  getBody,
  getId,
  getListQuery,
  getMergeTarget,
  getOrderIds,
  getSuggestQuery,
  toResponse,
} from './http.mapper.ts'

const isValidation = (err: unknown) => err instanceof ApiError && err.code === 'VALIDATION_ERROR'

test('getId exige un UUID', () => {
  const id = randomUUID()
  assert.equal(getId(fakeReq({ params: { id: id.toUpperCase() } })), id)
  assert.throws(() => getId(fakeReq({ params: { id: 'pas-un-uuid' } })), isValidation)
})

test('getListQuery lit q, active et include_merged', () => {
  const query = { q: '  react ', active: 'true', include_merged: 'false' }
  assert.deepEqual(getListQuery(fakeReq({ query })), {
    q: 'react',
    active: true,
    includeMerged: false,
  })
  assert.deepEqual(getListQuery(fakeReq()), {
    q: undefined,
    active: undefined,
    includeMerged: undefined,
  })
  assert.throws(() => getListQuery(fakeReq({ query: { active: 'oui' } })), isValidation)
})

test('getSuggestQuery borne la limite et accepte une saisie vide', () => {
  assert.deepEqual(getSuggestQuery(fakeReq({ query: { q: ' ja ' } })), { q: 'ja', limit: 10 })
  assert.deepEqual(getSuggestQuery(fakeReq()), { q: '', limit: 10 })
  assert.throws(() => getSuggestQuery(fakeReq({ query: { q: 'a', limit: '500' } })), isValidation)
})

test('getBody valide puis convertit les clés en camelCase', () => {
  const fields = { name_fr: { type: 'name', required: true }, active: { type: 'boolean' } } as const
  const body = { name_fr: '  Banque  ', active: false }
  assert.deepEqual(getBody(fakeReq({ body }), fields), { nameFr: 'Banque', active: false })
  assert.throws(() => getBody(fakeReq({ body: {} }), fields), isValidation)
  assert.throws(
    () => getBody(fakeReq({ body: { inconnu: 1 } }), fields, { partial: true }),
    isValidation,
  )
})

test('getMergeTarget refuse une cible absente, inconnue ou identique à la source', () => {
  const source = randomUUID()
  const target = randomUUID()
  assert.equal(getMergeTarget(fakeReq({ body: { target_id: target } }), source), target)
  assert.throws(() => getMergeTarget(fakeReq({ body: {} }), source), isValidation)
  assert.throws(
    () => getMergeTarget(fakeReq({ body: { target_id: source } }), source),
    isValidation,
  )
  assert.throws(
    () => getMergeTarget(fakeReq({ body: { target_id: target, autre: 1 } }), source),
    isValidation,
  )
})

test('getOrderIds exige une liste non vide d’identifiants distincts', () => {
  const [a, b] = [randomUUID(), randomUUID()]
  assert.deepEqual(getOrderIds(fakeReq({ body: { ids: [a, b] } })), [a, b])
  assert.throws(() => getOrderIds(fakeReq({ body: { ids: [] } })), isValidation)
  assert.throws(() => getOrderIds(fakeReq({ body: { ids: [a, a] } })), isValidation)
  assert.throws(() => getOrderIds(fakeReq({ body: { ids: ['x'] } })), isValidation)
  assert.throws(() => getOrderIds(fakeReq()), isValidation)
})

test('toResponse renvoie des clés snake_case', () => {
  assert.deepEqual(toResponse({ mergedIntoId: null, labelFr: 'Expert' }), {
    merged_into_id: null,
    label_fr: 'Expert',
  })
})
