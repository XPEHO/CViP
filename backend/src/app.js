import express from 'express'
import cors from 'cors'
import healthRouter from './routes/health.js'

const app = express()
app.disable("x-powered-by");

app.use(cors({ origin: process.env.CORS_ORIGIN }))
app.use(express.json())

app.use('/api/health', healthRouter)

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.use((err, req, res, _next) => {
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
})

export default app
