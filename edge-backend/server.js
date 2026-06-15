// Ensure environment variables are loaded before other imports
import 'dotenv/config'

import express from 'express'
import cors from 'cors'

// Import routes
import identityRoutes from './routes/identity.js'
import recordsRoutes from './routes/records.js'
import aiRoutes from './routes/ai.js'
import merkleRoutes from './routes/merkle.js'
import blockchainRoutes from './routes/blockchain.js'
import syncRoutes from './routes/sync.js'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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

// Error handling middleware
app.use((err, req, res, next) => {
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

app.listen(PORT, () => {
  console.log(`🚀 EdgeMed Backend running on http://localhost:${PORT}`)
  console.log(`📊 AI Service: ${process.env.AI_SERVICE_URL}`)
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL}`)
})
