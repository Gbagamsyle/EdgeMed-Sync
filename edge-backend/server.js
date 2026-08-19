// Ensure environment variables are loaded before other imports
import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import express from 'express'
import cors from 'cors'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'

// Import routes
import identityRoutes from './routes/identity.js'
import recordsRoutes from './routes/records.js'
import aiRoutes from './routes/ai.js'
import merkleRoutes from './routes/merkle.js'
import blockchainRoutes from './routes/blockchain.js'
import syncRoutes from './routes/sync.js'
import auditRoutes from './routes/audit.js'

export const app = express()
const PORT = process.env.PORT || 3001

// Normalize frontend origin (remove trailing slash if present)
const FRONTEND_ORIGIN = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')

// Global rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' }
})

// Stricter limit on AI endpoint
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'AI prediction rate limit exceeded' }
})

// Middleware
app.use(compression())
app.use(helmet())

// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`)
    }
    next()
  })
}

app.use(limiter)
app.use('/api/ai', aiLimiter)
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api/identity', identityRoutes)
app.use('/api/records', recordsRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/merkle', merkleRoutes)
app.use('/api/blockchain', blockchainRoutes)
app.use('/api/sync', syncRoutes)
app.use('/api/audit', auditRoutes)

// Error handling middleware
app.use((err, req, res) => {
  console.error('[ERROR]', err.message)
  res.status(err.status || 500).json({
    error: err.message,
    timestamp: new Date().toISOString()
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isMainModule) {
  app.listen(PORT, () => {
    console.log(`🚀 Edge-Health Backend running on http://localhost:${PORT}`)
    console.log(`📊 AI Service: ${process.env.AI_SERVICE_URL}`)
    console.log(`🌐 CORS enabled for: ${FRONTEND_ORIGIN}`)
  })
}

export default app
