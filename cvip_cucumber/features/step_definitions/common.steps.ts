/** Steps shared by all features: generic requests, item creation and assertions. */
import { Given, Then, When } from '@cucumber/cucumber'
import type { DataTable } from '@cucumber/cucumber'
import assert from 'node:assert/strict'
import { callApi } from '../support/http.ts'
import { fieldOf } from '../support/world.ts'
import type { CvipWorld } from '../support/world.ts'

/** Items of a response that must be a JSON array. */
function listOf(world: CvipWorld): Record<string, unknown>[] {
  assert.ok(
    Array.isArray(world.response.body),
    `Une liste est attendue : ${JSON.stringify(world.response.body)}`,
  )
  return world.response.body as Record<string, unknown>[]
}

Given(
  "l'élément {string} est créé sur {string} avec le corps :",
  async function (this: CvipWorld, name: string, path: string, docString: string) {
    const response = await callApi('POST', this.fill(path), {
      body: JSON.parse(this.fill(docString)),
    })
    assert.equal(response.status, 201, JSON.stringify(response.body))
    this.items.set(name, response.body as Record<string, unknown>)
  },
)

When('je lis {string}', async function (this: CvipWorld, path: string) {
  this.response = await callApi('GET', this.fill(path))
})

When(
  'j’envoie une requête {word} sur {string}',
  async function (this: CvipWorld, method: string, path: string) {
    this.response = await callApi(method, this.fill(path))
  },
)

When(
  'j’envoie une requête {word} sur {string} avec le corps :',
  async function (this: CvipWorld, method: string, path: string, docString: string) {
    this.response = await callApi(method, this.fill(path), {
      body: JSON.parse(this.fill(docString)),
    })
  },
)

When(
  'j’envoie une requête {word} sur {string} avec le corps brut {string}',
  async function (this: CvipWorld, method: string, path: string, raw: string) {
    this.response = await callApi(method, this.fill(path), { rawBody: raw })
  },
)

Then('je reçois le statut {int}', function (this: CvipWorld, status: number) {
  assert.equal(this.response.status, status, JSON.stringify(this.response.body))
})

Then(
  'je reçois l’erreur {string} avec le statut {int}',
  function (this: CvipWorld, code: string, status: number) {
    assert.equal(this.response.status, status, JSON.stringify(this.response.body))
    assert.equal(fieldOf(this.response.body, 'code'), code)
    assert.equal(typeof fieldOf(this.response.body, 'message'), 'string')
  },
)

Then(
  'le champ {string} vaut {string}',
  function (this: CvipWorld, field: string, expected: string) {
    assert.equal(String(fieldOf(this.response.body, field)), this.fill(expected))
  },
)

Then(
  'le champ {string} vaut l’identifiant de {string}',
  function (this: CvipWorld, field: string, name: string) {
    assert.equal(fieldOf(this.response.body, field), this.idOf(name))
  },
)

Then('la liste est vide', function (this: CvipWorld) {
  assert.deepEqual(listOf(this), [])
})

Then('la liste contient {int} élément(s)', function (this: CvipWorld, count: number) {
  assert.equal(listOf(this).length, count)
})

Then('la liste contient {string}', function (this: CvipWorld, name: string) {
  assert.ok(
    listOf(this).some((item) => item.id === this.idOf(name)),
    `« ${name} » devrait être dans la liste`,
  )
})

Then('la liste ne contient pas {string}', function (this: CvipWorld, name: string) {
  assert.ok(
    !listOf(this).some((item) => item.id === this.idOf(name)),
    `« ${name} » ne devrait pas être dans la liste`,
  )
})

Then(
  'les valeurs du champ {string} de la liste sont, dans l’ordre :',
  function (this: CvipWorld, field: string, table: DataTable) {
    const expected = table.raw().map(([value]) => this.fill(value ?? ''))
    assert.deepEqual(
      listOf(this).map((item) => item[field]),
      expected,
    )
  },
)

Then(
  'dans la liste, {string} a pour {string} la valeur {string}',
  function (this: CvipWorld, name: string, field: string, expected: string) {
    const item = listOf(this).find((candidate) => candidate.id === this.idOf(name))
    assert.ok(item, `« ${name} » devrait être dans la liste`)
    assert.equal(String(item[field]), this.fill(expected))
  },
)
