/** Business rules shared by the referentials, independent of HTTP and of the database (injected repository). */
import type { DeepPartial } from 'typeorm'
import type {
  ListFilter,
  MergeableReferentialRepository,
  ReferentialRepository,
  ReferentialRow,
} from '../repositories/referential.repository.ts'
import {
  ReferentialAlreadyMergedError,
  ReferentialMergedError,
  ReferentialNotFoundError,
  ReferentialTargetInactiveError,
  ReferentialTargetMergedError,
} from './referential.errors.ts'

/** Business operations shared by all referentials. */
export interface ReferentialService<E extends ReferentialRow> {
  list: (filter: ListFilter) => Promise<E[]>
  get: (id: string) => Promise<E>
  create: (values: DeepPartial<E>) => Promise<E>
  update: (id: string, values: DeepPartial<E>) => Promise<E>
}

/** Additional operations of the referentials whose duplicates are merged. */
export interface MergeableReferentialService<
  E extends ReferentialRow,
> extends ReferentialService<E> {
  suggest: (q: string, limit: number) => Promise<E[]>
  merge: (sourceId: string, targetId: string) => Promise<E>
}

/** Creates the service of the common operations from a repository. */
export const createReferentialService = <E extends ReferentialRow>(
  repository: ReferentialRepository<E>,
): ReferentialService<E> => ({
  list: (filter) => repository.list(filter),

  get: async (id) => {
    const item = await repository.findById(id)
    if (!item) throw new ReferentialNotFoundError()
    return item
  },

  create: (values) => repository.create(values),

  update: async (id, values) => {
    const updated = await repository.update(id, values)
    if (updated) return updated
    if (await repository.findById(id)) {
      throw new ReferentialMergedError()
    }
    throw new ReferentialNotFoundError()
  },
})

/** Creates the service of the mergeable referentials: common operations, autocomplete and merge. */
export const createMergeableReferentialService = <E extends ReferentialRow>(
  repository: MergeableReferentialRepository<E>,
): MergeableReferentialService<E> => ({
  ...createReferentialService(repository),

  suggest: async (q, limit) => (q === '' ? [] : repository.suggest(q, limit)),

  /** Merges `sourceId` into `targetId`: usages moved to the target, source disabled and redirected to it. */
  merge: (sourceId, targetId) =>
    repository.transaction(async (manager) => {
      // Both rows are locked to avoid races between simultaneous merges.
      const rows = await repository.lockByIds([sourceId, targetId], manager)
      const source = rows.find((row) => row.id === sourceId)
      const destination = rows.find((row) => row.id === targetId)
      if (!source || !destination) throw new ReferentialNotFoundError()
      if (source.mergedIntoId) throw new ReferentialAlreadyMergedError()
      if (destination.mergedIntoId) throw new ReferentialTargetMergedError()
      if (!destination.active) throw new ReferentialTargetInactiveError()

      await repository.moveReferences(manager, sourceId, targetId)
      // No merge chains: the items already merged into the source point to the target.
      await repository.repointMerged(manager, sourceId, targetId)
      await repository.markMerged(manager, sourceId, targetId)
      return (await repository.findById(targetId, manager)) as E
    }),
})
