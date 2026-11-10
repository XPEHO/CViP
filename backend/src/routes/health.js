import { Router } from 'express'
import { query } from '../db/index.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    await query('SELECT 1')
    res.json({ status: 'ok', db: 'up' })
  } catch (err) {
    res.status(503).json({ status: 'degraded', db: 'down', error: err.message })
  }
})

export default router
