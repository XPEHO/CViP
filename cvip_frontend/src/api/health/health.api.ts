/** Call to the API health check (`GET /api/health`). */
import { ApiError } from '../core/api-error'
import { request } from '../core/http-client'

/** State of the API and its database. */
export interface Health {
  status: 'ok' | 'degraded'
  db: 'connected' | 'unavailable'
}

/** Queries the API; an unreachable database (503) is a state, not an error. */
export async function getHealth(): Promise<Health> {
  try {
    return await request<Health>('/health')
  } catch (error) {
    if (error instanceof ApiError && error.status === 503) {
      return { status: 'degraded', db: 'unavailable' }
    }
    throw error
  }
}
