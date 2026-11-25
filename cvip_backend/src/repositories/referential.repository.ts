/** Generic referential repository: TypeORM access, raw SQL limited to the documented cases. */
import { In, IsNull } from 'typeorm'
import type {
  DataSource,
  DeepPartial,
  EntityManager,
  EntityTarget,
  FindOptionsWhere,
} from 'typeorm'
import { ReferentialDuplicateError } from '../services/referential.errors.ts'
import { isUniqueViolation } from '../utils/pg-error.ts'
import { escapeLike } from '../utils/validation.ts'

/** Columns shared by every referential entity, read by the repository and the services. */
export interface ReferentialRow {
  id: string
  active: boolean
  mergedIntoId?: string | null
}

/** Filters of a referential list. */
export interface ListFilter {
  q?: string
  active?: boolean
  includeMerged?: boolean
}

/** Persistence operations of a referential; the services depend on them, never on TypeORM. */
export interface ReferentialRepository<E extends ReferentialRow> {
  list: (filter: ListFilter) => Promise<E[]>
  findById: (id: string, manager?: EntityManager) => Promise<E | null>
  create: (values: DeepPartial<E>) => Promise<E>
  /** Updates an item; returns `null` if it does not exist or has been merged. */
  update: (id: string, values: DeepPartial<E>) => Promise<E | null>
}

/** Additional operations of the referentials whose duplicates are merged. */
export interface MergeableReferentialRepository<
  E extends ReferentialRow,
> extends ReferentialRepository<E> {
  /** Active items whose name, or the name of a merged duplicate, matches the input. */
  suggest: (q: string, limit: number) => Promise<E[]>
  transaction: <T>(fn: (manager: EntityManager) => Promise<T>) => Promise<T>
  lockByIds: (ids: string[], manager: EntityManager) => Promise<E[]>
  moveReferences: (manager: EntityManager, sourceId: string, targetId: string) => Promise<void>
  /** Points the items already merged into the source to the target (no chains). */
  repointMerged: (manager: EntityManager, sourceId: string, targetId: string) => Promise<void>
  markMerged: (manager: EntityManager, sourceId: string, targetId: string) => Promise<void>
}

/** Description of a referential for the generic repository (SQL column names, not properties). */
export interface ReferentialSpec<E extends ReferentialRow> {
  entity: EntityTarget<E>
  table: string
  searchColumns: string[]
  /** SQL ordering expressions; `alias` prefixes the columns. */
  orderBy: (alias: string) => string[]
}

const ALIAS = 'r'

/** Translates a uniqueness violation into a business error, rethrows any other error. */
export const translateUniqueViolation = (err: unknown): never => {
  if (isUniqueViolation(err)) {
    throw new ReferentialDuplicateError()
  }
  throw err
}

/** Creates the repository of the operations shared by all referentials. */
export const createReferentialRepository = <E extends ReferentialRow>(
  dataSource: DataSource,
  spec: ReferentialSpec<E>,
  { mergeable }: { mergeable: boolean },
): ReferentialRepository<E> => {
  /** TypeORM repository of the entity, bound to the transaction `manager` when provided. */
  const repoOf = (manager: EntityManager = dataSource.manager) => manager.getRepository(spec.entity)

  /** Item with identifier `id`, or `null`. */
  const findById = async (id: string, manager?: EntityManager): Promise<E | null> =>
    repoOf(manager).findOneBy({ id } as FindOptionsWhere<E>)

  return {
    findById,

    list: async ({ q, active, includeMerged }) => {
      const qb = repoOf().createQueryBuilder(ALIAS)
      if (q) {
        const matches = spec.searchColumns.map((column) => `${ALIAS}.${column} ILIKE :q`)
        qb.andWhere(`(${matches.join(' OR ')})`, { q: `%${escapeLike(q)}%` })
      }
      if (active !== undefined) qb.andWhere(`${ALIAS}.active = :active`, { active })
      if (mergeable && !includeMerged) qb.andWhere(`${ALIAS}.merged_into_id IS NULL`)
      spec.orderBy(ALIAS).forEach((expression, index) => {
        if (index === 0) qb.orderBy(expression)
        else qb.addOrderBy(expression)
      })
      return qb.getMany()
    },

    create: async (values) => {
      try {
        const saved = await repoOf().save(repoOf().create(values))
        // Read back: the database defaults (kind, active…) are not all returned.
        return (await findById(saved.id)) as E
      } catch (err) {
        return translateUniqueViolation(err)
      }
    },

    update: async (id, values) => {
      const where = (mergeable ? { id, mergedIntoId: IsNull() } : { id }) as FindOptionsWhere<E>
      try {
        const result = await repoOf().update(
          where,
          values as Parameters<ReturnType<typeof repoOf>['update']>[1],
        )
        if (!result.affected) return null
      } catch (err) {
        return translateUniqueViolation(err)
      }
      return findById(id)
    },
  }
}

/** Creates the merge and autocomplete operations, in raw SQL where TypeORM is not enough. */
export const createMergeOperations = <E extends ReferentialRow>(
  dataSource: DataSource,
  spec: ReferentialSpec<E>,
  moveReferences: MergeableReferentialRepository<E>['moveReferences'],
): Omit<MergeableReferentialRepository<E>, keyof ReferentialRepository<E>> => {
  /** TypeORM repository of the entity, bound to the transaction `manager` when provided. */
  const repoOf = (manager: EntityManager = dataSource.manager) => manager.getRepository(spec.entity)

  return {
    // Raw SQL exception: join on the canonical item, grouping and relevance ordering.
    suggest: async (q, limit) => {
      /** `ILIKE` condition on the search columns of the table `alias`, with the parameter `$param`. */
      const search = (alias: string, param: number) =>
        spec.searchColumns.map((column) => `${alias}.${column} ILIKE $${param}`).join(' OR ')
      const rows: { id: string }[] = await dataSource.query(
        `SELECT c.id
         FROM ${spec.table} s
         JOIN ${spec.table} c ON c.id = coalesce(s.merged_into_id, s.id)
         WHERE c.active AND c.merged_into_id IS NULL AND (${search('s', 1)})
         GROUP BY c.id
         ORDER BY min(CASE WHEN ${search('s', 2)} THEN 0 ELSE 1 END), ${spec.orderBy('c').join(', ')}
         LIMIT $3`,
        [`%${escapeLike(q)}%`, `${escapeLike(q)}%`, limit],
      )
      const ids = rows.map((row) => row.id)
      if (ids.length === 0) return []
      const items = await repoOf().findBy({ id: In(ids) } as FindOptionsWhere<E>)
      return ids.map((id) => items.find((item) => item.id === id) as E)
    },

    transaction: (fn) => dataSource.transaction(fn),

    lockByIds: (ids, manager) =>
      repoOf(manager)
        .createQueryBuilder(ALIAS)
        .setLock('pessimistic_write')
        .where(`${ALIAS}.id IN (:...ids)`, { ids })
        .orderBy(`${ALIAS}.id`)
        .getMany(),

    moveReferences,

    repointMerged: async (manager, sourceId, targetId) => {
      await repoOf(manager).update(
        { mergedIntoId: sourceId } as FindOptionsWhere<E>,
        { mergedIntoId: targetId } as never,
      )
    },

    markMerged: async (manager, sourceId, targetId) => {
      await repoOf(manager).update(
        { id: sourceId } as FindOptionsWhere<E>,
        { mergedIntoId: targetId, active: false } as never,
      )
    },
  }
}
