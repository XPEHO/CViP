import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isValidBranch } from './check-branch.mjs'

test('accepte les noms conformes', () => {
  for (const name of [
    'feat/CVIP-21',
    'fix/CVIP-3',
    'chore/CVIP-36',
    'main',
    'dependabot/npm_and_yarn/dotenv-18.0.9',
  ]) {
    assert.equal(isValidBranch(name), true, name)
  }
})

test('refuse les noms non conformes', () => {
  for (const name of [
    'foo',
    'feat/sans-ticket',
    'feat/CVIP-21-version-commerciale',
    'feat/CVIP-',
    'feature/CVIP-21',
    'feat/cvip-21',
    'feat/21',
    'chore/maquettes',
  ]) {
    assert.equal(isValidBranch(name), false, name)
  }
})
