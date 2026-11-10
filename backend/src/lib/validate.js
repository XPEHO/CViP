import { HttpError } from './http-error.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Saisie libre normalisée : espaces superflus supprimés, casse conservée.
export const normalizeName = (value) => value.trim().replaceAll(/\s+/g, ' ')

export const parseUuid = (value, label = 'id') => {
  if (typeof value !== 'string' || !UUID_RE.test(value)) throw new HttpError(400, `${label} invalide`)
  return value.toLowerCase()
}

export const escapeLike = (value) => value.replaceAll(/[\\%_]/g, String.raw`\$&`)

export const parseQueryString = (value, label) => {
  if (value === undefined) return undefined
  if (typeof value !== 'string') throw new HttpError(400, `${label} invalide`)
  return value
}

export const parseQueryBoolean = (value, label) => {
  if (value === undefined) return undefined
  if (value === 'true') return true
  if (value === 'false') return false
  throw new HttpError(400, `${label} doit valoir true ou false`)
}

export const parseQueryLimit = (value, { fallback, max }) => {
  if (value === undefined) return fallback
  const limit = Number(value)
  if (!Number.isInteger(limit) || limit < 1 || limit > max) {
    throw new HttpError(400, `limit doit être un entier entre 1 et ${max}`)
  }
  return limit
}

const parsers = {
  name(value, key) {
    if (typeof value !== 'string' || normalizeName(value) === '') throw new HttpError(400, `${key} est obligatoire`)
    return normalizeName(value)
  },
  text(value, key) {
    if (value === null) return null
    if (typeof value !== 'string') throw new HttpError(400, `${key} doit être une chaîne`)
    return normalizeName(value) || null
  },
  boolean(value, key) {
    if (typeof value !== 'boolean') throw new HttpError(400, `${key} doit être un booléen`)
    return value
  },
  rank(value, key) {
    if (!Number.isInteger(value) || value < 1 || value > 32767) {
      throw new HttpError(400, `${key} doit être un entier positif`)
    }
    return value
  },
  enum(value, key, field) {
    if (!field.values.includes(value)) throw new HttpError(400, `${key} doit valoir ${field.values.join(' ou ')}`)
    return value
  },
}

/**
 * Valide un corps JSON selon une description de champs ({ clé: { type, required, values } }).
 * Les clés inconnues sont refusées. En mode partiel (PATCH), seuls les champs présents sont validés.
 */
export const parseBody = (body, fields, { partial = false } = {}) => {
  const input = body ?? {}
  if (typeof input !== 'object' || Array.isArray(input)) throw new HttpError(400, 'Corps de requête invalide')

  const unknown = Object.keys(input).filter((key) => !Object.hasOwn(fields, key))
  if (unknown.length > 0) throw new HttpError(400, `Champ(s) inconnu(s) : ${unknown.join(', ')}`)

  const values = {}
  for (const [key, field] of Object.entries(fields)) {
    if (input[key] === undefined) {
      if (field.required && !partial) throw new HttpError(400, `${key} est obligatoire`)
      continue
    }
    values[key] = parsers[field.type](input[key], key, field)
  }
  if (partial && Object.keys(values).length === 0) throw new HttpError(400, 'Aucun champ à modifier')
  return values
}
