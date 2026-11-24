/** Translation between HTTP requests/responses (snake_case, text) and the typed values of the services. */
import type { Request } from 'express'
import type { ListFilter } from '../repositories/referential.repository.ts'
import { toCamelCaseKeys, toSnakeCaseKeys } from '../utils/naming.ts'
import { validationError } from '../utils/api-error.ts'
import {
  parseBody,
  parseQueryBoolean,
  parseQueryLimit,
  parseQueryString,
  parseUuid,
} from '../utils/validation.ts'
import type { FieldSpecs } from '../utils/validation.ts'

/** Identifier `:id` of the route. */
export const getId = (req: Request): string => parseUuid(req.params.id)

/** List filters: `q`, `active` and `include_merged`. */
export const getListQuery = (req: Request): ListFilter => ({
  q: parseQueryString(req.query.q, 'q')?.trim() || undefined,
  active: parseQueryBoolean(req.query.active, 'active'),
  includeMerged: parseQueryBoolean(req.query.include_merged, 'include_merged'),
})

/** Autocomplete parameters: input `q` and `limit` (10 by default, 50 at most). */
export const getSuggestQuery = (req: Request): { q: string; limit: number } => ({
  q: parseQueryString(req.query.q, 'q')?.trim() ?? '',
  limit: parseQueryLimit(req.query.limit, { fallback: 10, max: 50 }),
})

/** Create or update body, validated and converted to camelCase entity properties. */
export const getBody = (
  req: Request,
  fields: FieldSpecs,
  options: { partial?: boolean } = {},
): Record<string, unknown> => toCamelCaseKeys(parseBody(req.body, fields, options))

/** Merge target `target_id`; rejects an invalid body or a merge into itself. */
export const getMergeTarget = (req: Request, sourceId: string): string => {
  const { target_id: rawTargetId, ...rest } = (req.body ?? {}) as Record<string, unknown>
  const unknown = Object.keys(rest)
  if (unknown.length > 0) throw validationError(`Champ(s) inconnu(s) : ${unknown.join(', ')}`)
  const targetId = parseUuid(rawTargetId, 'target_id')
  if (sourceId === targetId) {
    throw validationError('Un élément ne peut pas être fusionné avec lui-même')
  }
  return targetId
}

/** List `ids` of a reordering: non-empty, valid identifiers and no duplicates. */
export const getOrderIds = (req: Request): string[] => {
  const ids = (req.body as { ids?: unknown } | undefined)?.ids
  if (!Array.isArray(ids) || ids.length === 0)
    throw validationError('ids doit être une liste non vide')
  const parsed = ids.map((id) => parseUuid(id, 'ids'))
  if (new Set(parsed).size !== parsed.length) throw validationError('ids contient des doublons')
  return parsed
}

/** JSON representation of an entity: snake_case keys, as in the API contract. */
export const toResponse = (entity: object): Record<string, unknown> => toSnakeCaseKeys(entity)
