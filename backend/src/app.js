import express from 'express'
import cors from 'cors'
import healthRouter from './routes/health.js'
import referentialsRouter from './routes/referentials/index.js'
import { toHttpError } from './lib/http-error.js'

const app = express()
app.disable("x-powered-by");

app.use(cors({ origin: process.env.CORS_ORIGIN }))
app.use(express.json())

app.use('/api/health', healthRouter)
app.use('/api', referentialsRouter)

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.use((err, req, res, _next) => {
  const httpError = toHttpError(err)
  if (httpError) return res.status(httpError.status).json({ error: httpError.message })
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

export default app
