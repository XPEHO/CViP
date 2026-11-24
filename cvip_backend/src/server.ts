/** Entry point: runs the migrations (failure = stop), connects the database, then listens on the port. */
import { fileURLToPath } from 'node:url'
import { runner } from 'node-pg-migrate'
import { createApp } from './app.ts'
import { config } from './config/env.ts'
import { AppDataSource } from './db/data-source.ts'

// The SQL migrations remain the only authority on the schema; without them the API does not start.
try {
  await runner({
    databaseUrl: config.databaseUrl,
    dir: fileURLToPath(new URL('../migrations', import.meta.url)),
    migrationsTable: 'pgmigrations',
    direction: 'up',
    log: () => {},
  })
} catch (err) {
  console.error('Échec des migrations', err)
  process.exit(1)
}

await AppDataSource.initialize()

const server = createApp().listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`)
})

/** Stops the server, then closes the database connection before exiting. */
const shutdown = () => {
  server.close(() => {
    void AppDataSource.destroy().then(() => process.exit(0))
  })
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
