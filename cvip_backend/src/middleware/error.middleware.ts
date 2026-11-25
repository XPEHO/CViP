/** Centralized error handling: unknown route, HTTP, PostgreSQL and unexpected errors. */
import type { ErrorRequestHandler, RequestHandler } from 'express'
import { ApiError, sendError } from '../utils/api-error.ts'
import { pgErrorCode } from '../utils/pg-error.ts'

/** PostgreSQL errors not caught by a controller, translated as a safety net. */
const PG_ERRORS: Record<string, ApiError> = {
  '23503': new ApiError('REFERENCED_OR_MISSING', 'Élément référencé introuvable ou encore utilisé'),
  '23514': new ApiError('VALIDATION_ERROR', 'Valeur refusée par une règle de validation'),
  '22P02': new ApiError('VALIDATION_ERROR', 'Valeur invalide'),
}

/**
 * Translates a thrown error into an ApiError, or returns null if it is unexpected
 * (the handler logs it and answers INTERNAL_ERROR).
 */
export const toApiError = (err: unknown): ApiError | null => {
  if (err instanceof ApiError) return err
  if (typeof err !== 'object' || err === null) return null

  const pgCode = pgErrorCode(err)
  if (pgCode && PG_ERRORS[pgCode]) return PG_ERRORS[pgCode]

  // Errors from express.json() (malformed or oversized body…).
  const { status, expose } = err as { status?: unknown; expose?: unknown }
  if (status === 413) return new ApiError('PAYLOAD_TOO_LARGE', 'Corps de requête trop volumineux')
  if (typeof status === 'number' && status >= 400 && status < 500 && expose) {
    return new ApiError('BAD_REQUEST', 'Requête mal formée')
  }
  return null
}

/** Answers 404 `NOT_FOUND` to any unknown route. */
export const handleNotFound: RequestHandler = (_req, _res, next) => {
  next(new ApiError('NOT_FOUND', 'Route introuvable'))
}

/** Final error handler: unexpected errors are logged without leaking details. */
export const handleError: ErrorRequestHandler = (err, _req, res, _next) => {
  const apiError = toApiError(err)
  if (apiError) {
    sendError(res, apiError.code, apiError.message, apiError.details)
    return
  }
  console.error(err)
  sendError(res, 'INTERNAL_ERROR', 'Erreur interne du serveur')
}
