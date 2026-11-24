/** API errors: stable codes, associated HTTP status and `{ code, message, details? }` response body. */
import type { Response } from 'express'

/** Referentials exposed by the API; each one prefixes the error codes of its domain. */
export type ReferentialDomain = 'SKILL' | 'SKILL_LEVEL' | 'SECTOR' | 'CERTIFICATION'

/** Referentials whose duplicates can be merged. */
export type MergeableDomain = Exclude<ReferentialDomain, 'SKILL_LEVEL'>

/** Stable API error codes; the frontend relies on them, never on the message text. */
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'BAD_REQUEST'
  | 'PAYLOAD_TOO_LARGE'
  | 'NOT_FOUND'
  | 'REFERENCED_OR_MISSING'
  | 'INTERNAL_ERROR'
  | `${ReferentialDomain}_NOT_FOUND`
  | `${ReferentialDomain}_DUPLICATE`
  | `${MergeableDomain}_MERGED`
  | `${MergeableDomain}_ALREADY_MERGED`
  | `${MergeableDomain}_TARGET_MERGED`
  | `${MergeableDomain}_TARGET_INACTIVE`
  | 'SKILL_DISABLED'

/** JSON body returned for any error. */
export interface ErrorBody {
  code: ErrorCode
  message: string
  details?: unknown
}

const FIXED_STATUS: Partial<Record<ErrorCode, number>> = {
  VALIDATION_ERROR: 400,
  BAD_REQUEST: 400,
  PAYLOAD_TOO_LARGE: 413,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
}

/** HTTP status of a code: `*_NOT_FOUND` is 404, business conflicts are 409. */
export const statusOf = (code: ErrorCode): number =>
  FIXED_STATUS[code] ?? (code.endsWith('_NOT_FOUND') ? 404 : 409)

/** Error thrown by the HTTP layer (mappers, validation) and translated by the error handler. */
export class ApiError extends Error {
  readonly code: ErrorCode
  readonly details: unknown

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.details = details
  }
}

/** 400 validation error of an input (body, parameter or query). */
export const validationError = (message: string, details?: unknown): ApiError =>
  new ApiError('VALIDATION_ERROR', message, details)

/** Sends the error body with the status associated with the code. */
export const sendError = (
  res: Response,
  code: ErrorCode,
  message: string,
  details?: unknown,
): void => {
  const body: ErrorBody = { code, message }
  if (details !== undefined) body.details = details
  res.status(statusOf(code)).json(body)
}
