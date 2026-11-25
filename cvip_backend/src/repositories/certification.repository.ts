/** Certification repository: raw SQL exception to move references during merges. */
import type { DataSource, EntityManager } from 'typeorm'
import { Certification } from '../entities/Certification.ts'
import { createMergeOperations, createReferentialRepository } from './referential.repository.ts'
import type { MergeableReferentialRepository, ReferentialSpec } from './referential.repository.ts'

const spec: ReferentialSpec<Certification> = {
  entity: Certification,
  table: 'certification',
  searchColumns: ['name', 'organization'],
  orderBy: (alias) => [`lower(${alias}.name)`, `lower(coalesce(${alias}.organization, ''))`],
}

/** Moves the CVs of `sourceId` to `targetId`; the title typed on the CV (`title`) is kept, only the link changes. */
const moveReferences = async (manager: EntityManager, sourceId: string, targetId: string) => {
  await manager.query(
    'UPDATE cv_certification SET certification_id = $2 WHERE certification_id = $1',
    [sourceId, targetId],
  )
}

/** Creates the certification repository. */
export const createCertificationRepository = (
  dataSource: DataSource,
): MergeableReferentialRepository<Certification> => ({
  ...createReferentialRepository(dataSource, spec, { mergeable: true }),
  ...createMergeOperations(dataSource, spec, moveReferences),
})
