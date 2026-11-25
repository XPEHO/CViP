/** Conversion of object keys between the API snake_case and the entity camelCase. */

/** Converts a camelCase key name to snake_case. */
const toSnake = (key: string): string => key.replaceAll(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
/** Converts a snake_case key name to camelCase. */
const toCamel = (key: string): string =>
  key.replaceAll(/_([a-z])/g, (_, c: string) => c.toUpperCase())

/** Returns a copy of the object with snake_case keys (`mergedIntoId` → `merged_into_id`). */
export const toSnakeCaseKeys = (value: object): Record<string, unknown> =>
  Object.fromEntries(Object.entries(value).map(([key, item]) => [toSnake(key), item]))

/** Returns a copy of the object with camelCase keys (`name_fr` → `nameFr`). */
export const toCamelCaseKeys = (value: object): Record<string, unknown> =>
  Object.fromEntries(Object.entries(value).map(([key, item]) => [toCamel(key), item]))
