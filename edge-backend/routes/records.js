/* eslint-env node */
/* global process */
import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getSupabase } from '../services/supabaseClient.js'
import { sha256Hash } from '../services/hashing.js'
import axios from 'axios'

const router = express.Router()

/**
 * POST /api/records
 * Create a new medical record: runs AI prediction, hashes, queues for sync
 */
router.post('/', async (req, res) => {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not initialized' })
    }

    const {
      patient_did,
      doctor_id,
      vitals,
      diagnosis_notes,
      recorded_by
    } = req.body

    if (!patient_did || !vitals) {
      return res.status(400).json({ error: 'patient_did and vitals required' })
    }

    const recordId = uuidv4()

    // Step 1: Get AI prediction from Flask service
    let aiPrediction = { label: 'No prediction', confidence: 0 }
    try {
      const aiResponse = await axios.post(
        `${process.env.AI_SERVICE_URL}/predict`,
        { vitals },
        { timeout: 5000 }
      )
      aiPrediction = aiResponse.data
    } catch (aiErr) {
      console.warn('[RECORDS] AI prediction failed (offline?):', aiErr.message)
      // Continue without AI prediction - offline fallback
    }

    // Step 2: Create record payload
    const recordPayload = {
      record_id: recordId,
      patient_did,
      doctor_id,
      vitals,
      ai_prediction: aiPrediction,
      diagnosis_notes,
      recorded_by,
      created_at: new Date().toISOString()
    }

    // Step 3: Hash the record
    const recordHash = sha256Hash(recordPayload)

    // Step 4: Store in Supabase (will be synced to Fog when online)
    const { error: insertError } = await supabase
      .from('records')
      .insert([
        {
          record_id: recordId,
          patient_did,
          doctor_id,
          vitals,
          ai_prediction: aiPrediction,
          diagnosis_notes,
          recorded_by,
          sha256_hash: recordHash,
          synced: false,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (insertError) {
      return res.status(500).json({ error: 'Failed to create record' })
    }

    // Step 5: Queue for sync (if offline, will sync when back online)
    // TODO: Implement sync queue logic

    res.json({
      record_id: recordId,
      sha256_hash: recordHash,
      ai_prediction: aiPrediction,
      message: 'Record created and queued for sync'
    })
  } catch (err) {
    console.error('[RECORDS] Create error:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/records/:recordId
 * Fetch a record by ID
 */
router.get('/:recordId', async (req, res) => {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not initialized' })
    }

    const { recordId } = req.params

    const { data: record, error } = await supabase
      .from('records')
      .select('*')
      .eq('record_id', recordId)
      .single()

    if (error || !record) {
      return res.status(404).json({ error: 'Record not found' })
    }

    res.json(record)
  } catch (err) {
    console.error('[RECORDS] Fetch error:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/records/patient/:patientDID
 * Get all records for a patient
 */
router.get('/patient/:patientDID', async (req, res) => {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not initialized' })
    }

    const { patientDID } = req.params
    const { limit = 50 } = req.query

    const { data: records, error } = await supabase
      .from('records')
      .select('*')
      .eq('patient_did', patientDID)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit))

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch records' })
    }

    res.json(records || [])
  } catch (err) {
    console.error('[RECORDS] Patient fetch error:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router
