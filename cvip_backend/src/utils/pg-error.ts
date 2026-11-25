/** Reading the SQLSTATE code of a PostgreSQL error, raw (`pg`) or wrapped by TypeORM. */

/** Returns the SQLSTATE code of an error, or `undefined` if it is not one. */
export const pgErrorCode = (err: unknown): string | undefined => {
  if (typeof err !== 'object' || err === null) return undefined
  const { code, driverError } = err as { code?: unknown; driverError?: { code?: unknown } }
  const value = typeof code === 'string' ? code : driverError?.code
  return typeof value === 'string' ? value : undefined
}

/** Tells whether the error is a uniqueness constraint violation (SQLSTATE 23505). */
export const isUniqueViolation = (err: unknown): boolean => pgErrorCode(err) === '23505'
