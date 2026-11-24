/** Builds the Express application: security, routes and error handling. */
import express from 'express'
import type { Express } from 'express'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import { buildOpenApiSpec } from './config/openapi.ts'
import { handleError, handleNotFound } from './middleware/error.middleware.ts'
import { healthRouter } from './routes/health.routes.ts'
import { router } from './routes/index.ts'

/** Creates the application without listening; the frontend is served from the same origin (proxy), so there is no CORS. */
export const createApp = (): Express => {
  const app = express()
  app.disable('x-powered-by')

  app.use(helmet())
  app.use(express.json())

  // The `/api` prefix belongs to the proxy (nginx in production, Vite in dev): it is stripped before
  // reaching this app, so the documentation is reachable at `/api/api-docs`.
  const spec = buildOpenApiSpec()
  app.get('/api-docs.json', (_req, res) => {
    res.json(spec)
  })
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec))

  app.use('/health', healthRouter)
  app.use(router)

  app.use(handleNotFound)
  app.use(handleError)
  return app
}
