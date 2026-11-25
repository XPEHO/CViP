/** Health service: tells whether the API can reach its database. */

/** Health check result; no error detail is exposed (public endpoint). */
export interface HealthReport {
  status: 'ok' | 'degraded'
  db: 'connected' | 'unavailable'
}

/** Queries the database through `ping` (injected) and summarizes its state. */
export const checkHealth = async (ping: () => Promise<unknown>): Promise<HealthReport> => {
  try {
    await ping()
    return { status: 'ok', db: 'connected' }
  } catch {
    return { status: 'degraded', db: 'unavailable' }
  }
}
