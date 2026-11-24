import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildOpenApiSpec } from './openapi.ts'

const spec = buildOpenApiSpec() as {
  paths: Record<string, Record<string, unknown>>
  components: { schemas: Record<string, unknown> }
}

const refs = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.flatMap(refs)
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) =>
      key === '$ref' ? [String(item)] : refs(item),
    )
  }
  return []
}

test('la spec documente les routes de chaque référentiel', () => {
  for (const base of ['/skills', '/skill-levels', '/sectors', '/certifications']) {
    assert.ok(spec.paths[base]?.get, `GET ${base}`)
    assert.ok(spec.paths[base]?.post, `POST ${base}`)
    assert.ok(spec.paths[`${base}/{id}`]?.get, `GET ${base}/{id}`)
    assert.ok(spec.paths[`${base}/{id}`]?.patch, `PATCH ${base}/{id}`)
  }
  for (const base of ['/skills', '/sectors', '/certifications']) {
    assert.ok(spec.paths[`${base}/suggest`]?.get, `GET ${base}/suggest`)
    assert.ok(spec.paths[`${base}/{id}/merge`]?.post, `POST ${base}/{id}/merge`)
  }
  assert.ok(spec.paths['/skills/resolve']?.post)
  assert.ok(spec.paths['/skill-levels/order']?.put)
  assert.ok(spec.paths['/health']?.get)
})

test('les niveaux, non fusionnables, n’exposent ni autocomplétion ni fusion', () => {
  assert.equal(spec.paths['/skill-levels/suggest'], undefined)
  assert.equal(spec.paths['/skill-levels/{id}/merge'], undefined)
})

test('toutes les références $ref pointent vers un schéma existant', () => {
  const names = new Set(Object.keys(spec.components.schemas))
  const used = refs(spec)
  assert.ok(used.length > 0)
  for (const ref of used) {
    const name = ref.replace('#/components/schemas/', '')
    assert.ok(names.has(name), `schéma manquant : ${name}`)
  }
})
