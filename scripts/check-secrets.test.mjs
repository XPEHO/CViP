import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'

test('ne bloque pas le commit quand gitleaks est absent', () => {
  // PATH vide : gitleaks est introuvable, Node reste lancé par son chemin absolu.
  const result = spawnSync(process.execPath, ['scripts/check-secrets.mjs'], {
    env: { PATH: '' },
    encoding: 'utf8',
  })

  assert.equal(result.status, 0)
  assert.match(result.stderr, /gitleaks not installed/)
})
