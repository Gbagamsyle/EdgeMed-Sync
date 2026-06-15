/* eslint-env node */
/* global process */
import express from 'express'
import axios from 'axios'

const router = express.Router()

/**
 * POST /api/ai/predict
 * Proxy vitals to Flask AI service and return prediction
 */
router.post('/predict', async (req, res) => {
  try {
    const { vitals } = req.body

    if (!vitals) {
      return res.status(400).json({ error: 'vitals required' })
    }

    // Call Python Flask service
    const aiResponse = await axios.post(
      `${process.env.AI_SERVICE_URL}/predict`,
      { vitals },
      { timeout: 5000 }
    )

    res.json(aiResponse.data)
  } catch (err) {
    console.error('[AI] Prediction error:', err.message)
    
    // Return offline fallback
    res.status(err.response?.status || 503).json({
      error: 'AI service unavailable',
      fallback: { label: 'Unable to predict', confidence: 0 }
    })
  }
})

/**
 * GET /api/ai/status
 * Check if AI service is online
 */
router.get('/status', async (req, res) => {
  try {
    const healthCheck = await axios.get(
      `${process.env.AI_SERVICE_URL}/health`,
      { timeout: 2000 }
    )
    
    res.json({ status: 'online', aiService: healthCheck.data })
  } catch (err) {
    res.json({ status: 'offline', error: err.message })
  }
})

export default router
