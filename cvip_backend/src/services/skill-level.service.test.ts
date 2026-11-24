import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { EntityManager } from 'typeorm'
import type { SkillLevel } from '../entities/SkillLevel.ts'
import type { SkillLevelRepository } from '../repositories/skill-level.repository.ts'
import { ReferentialNotFoundError } from './referential.errors.ts'
import { createSkillLevelService } from './skill-level.service.ts'

const level = (id: string, rank: number) => ({ id, rank }) as unknown as SkillLevel

const fakeRepository = (existing: SkillLevel[]) => {
  const applied: { ids: string[]; ranks: number[] }[] = []
  const repository = {
    transaction: (fn: (manager: EntityManager) => Promise<unknown>) => fn({} as EntityManager),
    lockByIds: async (ids: string[]) => existing.filter((l) => ids.includes(l.id)),
    applyRanks: async (_manager: EntityManager, ids: string[], ranks: number[]) => {
      applied.push({ ids, ranks })
    },
    list: async () => existing,
  } as unknown as SkillLevelRepository
  return { repository, applied }
}

test('reorder redistribue, dans l’ordre fourni, les rangs que les niveaux occupent déjà', async () => {
  const { repository, applied } = fakeRepository([level('a', 7), level('b', 3), level('c', 9)])
  await createSkillLevelService(repository).reorder(['a', 'b'])
  // Ranks 7 and 3 sorted: the first level listed receives the smallest.
  assert.deepEqual(applied, [{ ids: ['a', 'b'], ranks: [3, 7] }])
})

test('reorder lève NOT_FOUND si un niveau est inconnu', async () => {
  const { repository, applied } = fakeRepository([level('a', 1)])
  await assert.rejects(
    createSkillLevelService(repository).reorder(['a', 'inconnu']),
    ReferentialNotFoundError,
  )
  assert.deepEqual(applied, [])
})
