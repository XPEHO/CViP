/** Scale level repository: raw SQL exception to swap ranks in a single statement. */
import type { DataSource, EntityManager } from 'typeorm'
import { SkillLevel } from '../entities/SkillLevel.ts'
import { createReferentialRepository } from './referential.repository.ts'
import type { ReferentialRepository, ReferentialSpec } from './referential.repository.ts'

/** Level repository, with rank redistribution. */
export interface SkillLevelRepository extends ReferentialRepository<SkillLevel> {
  transaction: <T>(fn: (manager: EntityManager) => Promise<T>) => Promise<T>
  /** Locks the requested levels and returns those that exist. */
  lockByIds: (ids: string[], manager: EntityManager) => Promise<SkillLevel[]>
  /** Assigns `ranks[i]` to level `ids[i]` in a single statement. */
  applyRanks: (manager: EntityManager, ids: string[], ranks: number[]) => Promise<void>
}

const spec: ReferentialSpec<SkillLevel> = {
  entity: SkillLevel,
  table: 'skill_level',
  searchColumns: ['label_fr', 'label_en'],
  orderBy: (alias) => [`${alias}.rank`],
}

/** Creates the level repository. */
export const createSkillLevelRepository = (dataSource: DataSource): SkillLevelRepository => ({
  ...createReferentialRepository(dataSource, spec, { mergeable: false }),

  transaction: (fn) => dataSource.transaction(fn),

  lockByIds: (ids, manager) =>
    manager
      .getRepository(SkillLevel)
      .createQueryBuilder('l')
      .setLock('pessimistic_write')
      .where('l.id IN (:...ids)', { ids })
      .getMany(),

  // Rank uniqueness is checked at the end of the statement (DEFERRABLE constraint): swaps go through.
  applyRanks: async (manager, ids, ranks) => {
    await manager.query(
      `UPDATE skill_level l SET rank = v.rank
       FROM unnest($1::uuid[], $2::smallint[]) AS v(id, rank)
       WHERE l.id = v.id`,
      [ids, ranks],
    )
  },
})
