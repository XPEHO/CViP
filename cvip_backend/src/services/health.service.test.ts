import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkHealth } from './health.service.ts'

test('checkHealth renvoie ok quand la base répond', async () => {
  assert.deepEqual(await checkHealth(async () => {}), { status: 'ok', db: 'connected' })
})

test('checkHealth renvoie degraded sans exposer le message d’erreur de la base', async () => {
  const report = await checkHealth(async () => {
    throw new Error('password authentication failed for user "cvip"')
  })
  assert.deepEqual(report, { status: 'degraded', db: 'unavailable' })
})
