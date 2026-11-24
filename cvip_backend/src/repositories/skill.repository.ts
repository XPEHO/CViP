/** Skill repository: raw SQL exceptions to move references and to search by name. */
import type { DataSource, EntityManager } from 'typeorm'
import { Skill } from '../entities/Skill.ts'
import { createMergeOperations, createReferentialRepository } from './referential.repository.ts'
import type { MergeableReferentialRepository, ReferentialSpec } from './referential.repository.ts'

/** Skill repository, with resolution of a free-text entry to the canonical item. */
export interface SkillRepository extends MergeableReferentialRepository<Skill> {
  /** Canonical item matching a name (its own name or the name of a merged item). */
  findCanonicalByName: (name: string) => Promise<Skill | null>
  /** Creates the skill if the name is free; returns `null` if it already exists (even concurrently). */
  insertIfAbsent: (name: string) => Promise<Skill | null>
}

const spec: ReferentialSpec<Skill> = {
  entity: Skill,
  table: 'skill',
  searchColumns: ['name'],
  orderBy: (alias) => [`lower(${alias}.name)`],
}

/** Moves the usages of `sourceId` to `targetId`; raw SQL because conflicting rows must be merged. */
const moveReferences = async (manager: EntityManager, sourceId: string, targetId: string) => {
  // CVs holding both skills: keep a single row, with the best level,
  // the greatest number of years and the best position.
  await manager.query(
    `UPDATE cv_skill t SET
       level_id = (SELECT l.id FROM skill_level l WHERE l.id IN (t.level_id, s.level_id) ORDER BY l.rank DESC LIMIT 1),
       years = greatest(t.years, s.years),
       position = least(t.position, s.position)
     FROM cv_skill s
     WHERE t.skill_id = $2 AND s.skill_id = $1 AND s.cv_id = t.cv_id`,
    [sourceId, targetId],
  )
  await manager.query(
    `DELETE FROM cv_skill s USING cv_skill t
     WHERE s.skill_id = $1 AND t.skill_id = $2 AND t.cv_id = s.cv_id`,
    [sourceId, targetId],
  )
  await manager.query('UPDATE cv_skill SET skill_id = $2 WHERE skill_id = $1', [sourceId, targetId])

  await manager.query(
    `DELETE FROM cv_experience_skill s USING cv_experience_skill t
     WHERE s.skill_id = $1 AND t.skill_id = $2 AND t.experience_id = s.experience_id`,
    [sourceId, targetId],
  )
  await manager.query('UPDATE cv_experience_skill SET skill_id = $2 WHERE skill_id = $1', [
    sourceId,
    targetId,
  ])
}

/** Creates the skill repository. */
export const createSkillRepository = (dataSource: DataSource): SkillRepository => {
  const base = createReferentialRepository(dataSource, spec, { mergeable: true })
  const merge = createMergeOperations(dataSource, spec, moveReferences)

  return {
    ...base,
    ...merge,

    // Raw SQL exception: join on the canonical item (its own name or a merged name).
    findCanonicalByName: async (name) => {
      const rows: { id: string }[] = await dataSource.query(
        `SELECT c.id FROM skill s
         JOIN skill c ON c.id = coalesce(s.merged_into_id, s.id)
         WHERE lower(s.name) = lower($1)`,
        [name],
      )
      return rows[0] ? base.findById(rows[0].id) : null
    },

    insertIfAbsent: async (name) => {
      const result = await dataSource
        .createQueryBuilder()
        .insert()
        .into(Skill)
        .values({ name })
        .orIgnore()
        .returning('id')
        .execute()
      const created = (result.raw as { id: string }[])[0]
      return created ? base.findById(created.id) : null
    },
  }
}
