import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { startTestDatabase, startTestServer } from './test-utils/integration.ts'
import type { TestDatabase, TestServer } from './test-utils/integration.ts'

let database: TestDatabase
let server: TestServer

before(async () => {
  database = await startTestDatabase()
  server = await startTestServer()
})

after(async () => {
  await server.close()
  await database.stop()
})

test('GET /health renvoie ok quand la base répond', async () => {
  const res = await server.api.get('/health')
  assert.equal(res.status, 200)
  assert.deepEqual(res.body, { status: 'ok', db: 'connected' })
})

test('route inconnue renvoie 404', async () => {
  const res = await server.api.get('/inconnue')
  assert.equal(res.status, 404)
  assert.deepEqual(res.body, { code: 'NOT_FOUND', message: 'Route introuvable' })
})

test('corps JSON mal formé renvoie BAD_REQUEST', async () => {
  const res = await server.api.postRaw('/skills', '{pas du json')
  assert.equal(res.status, 400)
  assert.equal(res.body.code, 'BAD_REQUEST')
})

test('la documentation OpenAPI est servie en JSON et en HTML', async () => {
  const spec = await server.api.get('/api-docs.json')
  assert.equal(spec.status, 200)
  assert.equal(spec.body.openapi, '3.0.3')
  assert.ok(spec.body.paths['/skills'])

  const page = await fetch(`${server.baseUrl}/api-docs/`)
  assert.equal(page.status, 200)
  assert.match(page.headers.get('content-type') ?? '', /text\/html/)
})
