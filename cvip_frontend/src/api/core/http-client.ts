/** Single HTTP client of the application: JSON requests on `/api` and conversion of errors into `ApiError`. */
import { ApiError, type ApiErrorCode } from './api-error'

/** Common prefix of the API addresses (same origin: Vite proxy in dev, nginx in production). */
export const BASE_URL = '/api'

/** Error body returned by the backend. */
interface BackendErrorBody {
  code?: ApiErrorCode
  message?: string
  details?: unknown
}

/** Converts an error response into an `ApiError`; without a usable JSON body it is `INTERNAL_ERROR`. */
async function toApiError(response: Response): Promise<ApiError> {
  let body: BackendErrorBody | null = null
  try {
    body = (await response.json()) as BackendErrorBody
  } catch {
    // Non-JSON response (proxy down, nginx error page): no usable code.
  }
  return new ApiError(
    body?.code ?? 'INTERNAL_ERROR',
    response.status,
    body?.message ?? 'Erreur inattendue.',
    body?.details,
  )
}

/** Sends a request to the API and returns the JSON body; throws `ApiError` on failure. */
export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init.headers },
    })
  } catch {
    throw new ApiError('NETWORK_ERROR', 0, 'Le serveur est injoignable.')
  }

  if (!response.ok) throw await toApiError(response)
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
