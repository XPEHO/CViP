/** User-facing message for an error, chosen from the `ApiError` code. */
import { ApiError, type ApiErrorCode } from '@/api/core/api-error'

/** Codes for which the client text is preferred over the server text. */
const MESSAGES: Partial<Record<ApiErrorCode, string>> = {
  NETWORK_ERROR: 'Le serveur est injoignable.',
  INTERNAL_ERROR: 'Une erreur inattendue est survenue.',
}

/** Message to display: client text for known codes, otherwise the server message, otherwise a generic text. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return MESSAGES[error.code] ?? error.message
  return 'Une erreur inattendue est survenue.'
}
