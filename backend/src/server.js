import app from './app.js'
import { pool } from './db/index.js'

const port = process.env.PORT || 3000

const server = app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})

const shutdown = () => {
  server.close(() => pool.end().then(() => process.exit(0)))
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
