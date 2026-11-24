/** Business sector repository: raw SQL exception to move references during merges. */
import type { DataSource, EntityManager } from 'typeorm'
import { Sector } from '../entities/Sector.ts'
import { createMergeOperations, createReferentialRepository } from './referential.repository.ts'
import type { MergeableReferentialRepository, ReferentialSpec } from './referential.repository.ts'

const spec: ReferentialSpec<Sector> = {
  entity: Sector,
  table: 'sector',
  searchColumns: ['name_fr', 'name_en'],
  orderBy: (alias) => [`lower(${alias}.name_fr)`],
}

/** Moves the CVs and experiences of `sourceId` to `targetId`; raw SQL because conflicting rows must be merged. */
const moveReferences = async (manager: EntityManager, sourceId: string, targetId: string) => {
  // CVs holding both sectors: keep the target, at the best position.
  await manager.query(
    `UPDATE cv_sector t SET position = least(t.position, s.position)
     FROM cv_sector s
     WHERE t.sector_id = $2 AND s.sector_id = $1 AND s.cv_id = t.cv_id`,
    [sourceId, targetId],
  )
  await manager.query(
    `DELETE FROM cv_sector s USING cv_sector t
     WHERE s.sector_id = $1 AND t.sector_id = $2 AND t.cv_id = s.cv_id`,
    [sourceId, targetId],
  )
  await manager.query('UPDATE cv_sector SET sector_id = $2 WHERE sector_id = $1', [
    sourceId,
    targetId,
  ])
  await manager.query('UPDATE cv_experience SET sector_id = $2 WHERE sector_id = $1', [
    sourceId,
    targetId,
  ])
}

/** Creates the sector repository. */
export const createSectorRepository = (
  dataSource: DataSource,
): MergeableReferentialRepository<Sector> => ({
  ...createReferentialRepository(dataSource, spec, { mergeable: true }),
  ...createMergeOperations(dataSource, spec, moveReferences),
})
