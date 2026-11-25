/** Health route (`/health`). */
import { Router } from 'express'
import { createHealthController } from '../controllers/health.controller.ts'
import { AppDataSource } from '../db/data-source.ts'

/** Health router: queries the database with `SELECT 1`; the cause of a failure stays in the logs. */
export const healthRouter = Router().get(
  '/',
  createHealthController(async () => {
    try {
      await AppDataSource.query('SELECT 1')
    } catch (err) {
      console.error('Contrôle de santé : base injoignable', err)
      throw err
    }
  }),
)
