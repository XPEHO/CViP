import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import type { EntityManager } from 'typeorm'
import type {
  MergeableReferentialRepository,
  ReferentialRow,
} from '../repositories/referential.repository.ts'
import {
  ReferentialAlreadyMergedError,
  ReferentialMergedError,
  ReferentialNotFoundError,
  ReferentialTargetInactiveError,
  ReferentialTargetMergedError,
} from './referential.errors.ts'
import {
  createMergeableReferentialService,
  createReferentialService,
} from './referential.service.ts'

const manager = {} as EntityManager
const row = (id: string, extra: Partial<ReferentialRow> = {}): ReferentialRow => ({
  id,
  active: true,
  mergedIntoId: null,
  ...extra,
})

/** Fake repository: `rows` simulates the table, `calls` keeps the order of the merge operations. */
const fakeRepository = (rows: ReferentialRow[] = []) => {
  const calls: string[] = []
  const repository: MergeableReferentialRepository<ReferentialRow> = {
    list: async () => rows,
    findById: async (id) => rows.find((r) => r.id === id) ?? null,
    create: async (values) => ({ ...row('new'), ...values }) as ReferentialRow,
    update: async (id, values) => {
      const found = rows.find((r) => r.id === id && !r.mergedIntoId)
      return found ? ({ ...found, ...values } as ReferentialRow) : null
    },
    suggest: async () => {
      calls.push('suggest')
      return rows
    },
    transaction: (fn) => fn(manager),
    lockByIds: async (ids) => rows.filter((r) => ids.includes(r.id)),
    moveReferences: async () => void calls.push('moveReferences'),
    repointMerged: async () => void calls.push('repointMerged'),
    markMerged: async () => void calls.push('markMerged'),
  }
  return { repository, calls }
}

describe('service de référentiel : opérations communes', () => {
  test('get renvoie l’élément ou lève NOT_FOUND', async () => {
    const service = createReferentialService(fakeRepository([row('a')]).repository)
    assert.equal((await service.get('a')).id, 'a')
    await assert.rejects(service.get('zzz'), ReferentialNotFoundError)
  })

  test('update distingue un élément fusionné (MERGED) d’un élément inconnu (NOT_FOUND)', async () => {
    const service = createReferentialService(
      fakeRepository([row('a'), row('old', { mergedIntoId: 'a', active: false })]).repository,
    )
    assert.equal((await service.update('a', { active: false })).active, false)
    await assert.rejects(service.update('old', { active: true }), ReferentialMergedError)
    await assert.rejects(service.update('zzz', { active: true }), ReferentialNotFoundError)
  })
})

describe('service de référentiel fusionnable', () => {
  test('suggest renvoie une liste vide pour une saisie vide sans interroger le dépôt', async () => {
    const { repository, calls } = fakeRepository([row('a')])
    const service = createMergeableReferentialService(repository)
    assert.deepEqual(await service.suggest('', 10), [])
    assert.deepEqual(calls, [])
    assert.equal((await service.suggest('a', 10)).length, 1)
  })

  test('merge reporte les références puis marque la source, dans cet ordre', async () => {
    const { repository, calls } = fakeRepository([row('src'), row('dst')])
    const merged = await createMergeableReferentialService(repository).merge('src', 'dst')
    assert.equal(merged.id, 'dst')
    assert.deepEqual(calls, ['moveReferences', 'repointMerged', 'markMerged'])
  })

  test('merge refuse les cas incohérents sans rien modifier', async () => {
    const cases: [ReferentialRow[], new () => Error][] = [
      [[row('src')], ReferentialNotFoundError],
      [
        [row('src', { mergedIntoId: 'x', active: false }), row('dst')],
        ReferentialAlreadyMergedError,
      ],
      [
        [row('src'), row('dst', { mergedIntoId: 'x', active: false })],
        ReferentialTargetMergedError,
      ],
      [[row('src'), row('dst', { active: false })], ReferentialTargetInactiveError],
    ]
    for (const [rows, errorClass] of cases) {
      const { repository, calls } = fakeRepository(rows)
      await assert.rejects(
        createMergeableReferentialService(repository).merge('src', 'dst'),
        errorClass,
      )
      assert.deepEqual(calls, [], errorClass.name)
    }
  })
})
