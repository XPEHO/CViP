import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import app from '../src/app.js'
import { pool } from '../src/db/index.js'

after(() => pool.end())

test('GET /api/health renvoie ok quand la base répond', async () => {
  const res = await request(app).get('/api/health')
  assert.equal(res.status, 200)
  assert.deepEqual(res.body, { status: 'ok', db: 'up' })
})

test('route inconnue renvoie 404', async () => {
  const res = await request(app).get('/api/inconnue')
  assert.equal(res.status, 404)
  assert.deepEqual(res.body, { error: 'Not found' })
})
