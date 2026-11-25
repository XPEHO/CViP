import { test } from 'node:test'
import assert from 'node:assert/strict'
import { toCamelCaseKeys, toSnakeCaseKeys } from './naming.ts'

test('toSnakeCaseKeys convertit les clés camelCase', () => {
  const date = new Date(0)
  assert.deepEqual(toSnakeCaseKeys({ mergedIntoId: null, nameFr: 'x', createdAt: date, id: 1 }), {
    merged_into_id: null,
    name_fr: 'x',
    created_at: date,
    id: 1,
  })
})

test('toCamelCaseKeys convertit les clés snake_case', () => {
  assert.deepEqual(toCamelCaseKeys({ name_fr: 'x', label_en: null, active: true }), {
    nameFr: 'x',
    labelEn: null,
    active: true,
  })
})

test('les deux conversions sont réciproques', () => {
  const source = { mergedIntoId: 'a', labelFr: 'b' }
  assert.deepEqual(toCamelCaseKeys(toSnakeCaseKeys(source)), source)
})
