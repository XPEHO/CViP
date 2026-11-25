/** Pure functions to validate and normalize inputs (body, parameters, query). */
import { validationError } from './api-error.ts'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Removes superfluous whitespace from a free-text entry, keeping the case. */
export const normalizeName = (value: string): string => value.trim().replaceAll(/\s+/g, ' ')

/** Checks that a value is a UUID and returns it in lowercase. */
export const parseUuid = (value: unknown, label = 'id'): string => {
  if (typeof value !== 'string' || !UUID_RE.test(value)) throw validationError(`${label} invalide`)
  return value.toLowerCase()
}

/** Escapes the LIKE special characters so they are taken literally. */
export const escapeLike = (value: string): string => value.replaceAll(/[\\%_]/g, String.raw`\$&`)

/** Reads an optional text query parameter. */
export const parseQueryString = (value: unknown, label: string): string | undefined => {
  if (value === undefined) return undefined
  if (typeof value !== 'string') throw validationError(`${label} invalide`)
  return value
}

/** Reads an optional boolean query parameter (`true` or `false`). */
export const parseQueryBoolean = (value: unknown, label: string): boolean | undefined => {
  if (value === undefined) return undefined
  if (value === 'true') return true
  if (value === 'false') return false
  throw validationError(`${label} doit valoir true ou false`)
}

/** Reads an integer limit between 1 and `max`, or returns the default value. */
export const parseQueryLimit = (
  value: unknown,
  { fallback, max }: { fallback: number; max: number },
): number => {
  if (value === undefined) return fallback
  const limit = Number(value)
  if (!Number.isInteger(limit) || limit < 1 || limit > max) {
    throw validationError(`limit doit être un entier entre 1 et ${max}`)
  }
  return limit
}

/** Description of a JSON body field (see parseBody). */
export type FieldSpec =
  | { type: 'name' | 'text' | 'boolean' | 'rank'; required?: boolean }
  | { type: 'enum'; required?: boolean; values: readonly string[] }

/** Description of the fields accepted by a JSON body, indexed by field name. */
export type FieldSpecs = Record<string, FieldSpec>

/** Required, normalized name. */
const parseName = (value: unknown, key: string): string => {
  if (typeof value !== 'string' || normalizeName(value) === '') {
    throw validationError(`${key} est obligatoire`)
  }
  return normalizeName(value)
}

/** Normalized free text, or `null` when empty. */
const parseText = (value: unknown, key: string): string | null => {
  if (value === null) return null
  if (typeof value !== 'string') throw validationError(`${key} doit être une chaîne`)
  return normalizeName(value) || null
}

/** Strict boolean. */
const parseBoolean = (value: unknown, key: string): boolean => {
  if (typeof value !== 'boolean') throw validationError(`${key} doit être un booléen`)
  return value
}

/** Integer rank between 1 and 32767. */
const parseRank = (value: unknown, key: string): number => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 32767) {
    throw validationError(`${key} doit être un entier positif`)
  }
  return value
}

/** Value belonging to the list `values`. */
const parseEnum = (value: unknown, key: string, values: readonly string[]): string => {
  if (typeof value !== 'string' || !values.includes(value)) {
    throw validationError(`${key} doit valoir ${values.join(' ou ')}`)
  }
  return value
}

/** Validates a value against the description of its field. */
const parseField = (value: unknown, key: string, field: FieldSpec): unknown => {
  switch (field.type) {
    case 'name':
      return parseName(value, key)
    case 'text':
      return parseText(value, key)
    case 'boolean':
      return parseBoolean(value, key)
    case 'rank':
      return parseRank(value, key)
    case 'enum':
      return parseEnum(value, key, field.values)
  }
}

/**
 * Validates a JSON body against a field description ({ key: { type, required, values } }).
 * Unknown keys are rejected. In partial mode (PATCH), only the fields present are validated.
 */
export const parseBody = (
  body: unknown,
  fields: FieldSpecs,
  { partial = false }: { partial?: boolean } = {},
): Record<string, unknown> => {
  const input = body ?? {}
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw validationError('Corps de requête invalide')
  }
  const record = input as Record<string, unknown>

  const unknown = Object.keys(record).filter((key) => !Object.hasOwn(fields, key))
  if (unknown.length > 0) throw validationError(`Champ(s) inconnu(s) : ${unknown.join(', ')}`)

  const values: Record<string, unknown> = {}
  for (const [key, field] of Object.entries(fields)) {
    if (record[key] === undefined) {
      if (field.required && !partial) throw validationError(`${key} est obligatoire`)
      continue
    }
    values[key] = parseField(record[key], key, field)
  }
  if (partial && Object.keys(values).length === 0) throw validationError('Aucun champ à modifier')
  return values
}
