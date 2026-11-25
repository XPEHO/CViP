/** Health controller: answers 200 if the database responds, 503 otherwise. */
import type { RequestHandler } from 'express'
import { checkHealth } from '../services/health.service.ts'

/** Creates the `GET /health` handler; `ping` queries the database. */
export const createHealthController = (ping: () => Promise<unknown>): RequestHandler => {
  return async (_req, res) => {
    const report = await checkHealth(ping)
    res.status(report.status === 'ok' ? 200 : 503).json(report)
  }
}
