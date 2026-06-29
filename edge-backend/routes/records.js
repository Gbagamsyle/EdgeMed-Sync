/* eslint-env node */
/* global process */
import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getSupabase } from '../services/supabaseClient.js'
import { sha256Hash } from '../services/hashing.js'
import { signRecord, fallbackSignRecord, verifySignature } from '../services/dilithiumSigning.js'
import axios from 'axios'

const router = express.Router()

/**
 * POST /api/records/create
 * Simplified endpoint for offline sync - creates a record from queued payload
 * Used by sync worker when coming back online
 */
router.post('/create', async (req, res) => {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not initialized' })
    }

    const {
      patientId,
      vitals,
      notes,
      staffId,
      createdAt
    } = req.body

    if (!patientId || !vitals) {
      return res.status(400).json({ error: 'patientId and vitals required' })
    }

    const recordId = uuidv4()

    // Step 1: Get AI prediction (optional, continues if fails)
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
    }

    // Step 2: Create record payload
    const recordPayload = {
      record_id: recordId,
      patient_id: patientId,
      vitals,
      notes,
      staff_id: staffId,
      ai_prediction: aiPrediction,
      synced: false,
      created_at: createdAt || new Date().toISOString()
    }

    // Step 3: Hash the record
    const recordHash = sha256Hash(recordPayload)
    recordPayload.sha256_hash = recordHash

    // Step 4: Sign the record with Dilithium
    let recordSignature = null
    try {
      const signResult = await signRecord(patientId, recordPayload)
      if (signResult.success) {
        recordSignature = signResult.signature
        console.log('[RECORDS] Record signed with Dilithium')
      } else {
        console.warn('[RECORDS] Dilithium signing failed, using fallback:', signResult.error)
        // Fallback to SHA256
        const fallbackResult = fallbackSignRecord(recordPayload)
        if (fallbackResult.success) {
          recordSignature = fallbackResult.signature
        }
      }
    } catch (sigErr) {
      console.warn('[RECORDS] Signing error (continuing):', sigErr.message)
      // Continue without signature rather than blocking record creation
    }

    // Step 5: Store in Supabase
    const { error: insertError } = await supabase
      .from('records')
      .insert([{
        ...recordPayload,
        dilithium_signature: recordSignature,
        synced: true
      }])

    if (insertError) {
      console.error('[RECORDS] Insert error:', insertError)
      return res.status(500).json({ error: 'Failed to create record' })
    }

    res.json({
      success: true,
      record_id: recordId,
      sha256_hash: recordHash,
      synced: true,
      message: 'Record synced successfully'
    })
  } catch (err) {
    console.error('[RECORDS] Create error:', err)
    res.status(500).json({ error: err.message })
  }
})

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

    // Step 5: Record is stored as unsynced and can be synchronized later by the frontend sync queue
    res.json({
      record_id: recordId,
      sha256_hash: recordHash,
      ai_prediction: aiPrediction,
      message: 'Record created and marked as unsynced'
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

/**
 * POST /api/records/verify
 * Verify a record signature for authenticity
 * Used in audit workflows to confirm record hasn't been tampered with
 */
router.post('/verify', async (req, res) => {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not initialized' })
    }

    const { record_id } = req.body

    if (!record_id) {
      return res.status(400).json({ error: 'record_id required' })
    }

    // Fetch record
    const { data: record, error: recordError } = await supabase
      .from('records')
      .select('*')
      .eq('record_id', record_id)
      .single()

    if (recordError || !record) {
      return res.status(404).json({ error: 'Record not found' })
    }

    // Fetch patient to get public key
    let patientQuery = supabase.from('patients').select('public_key').single()
    if (record.patient_id) {
      patientQuery = patientQuery.eq('id', record.patient_id)
    } else if (record.patient_did) {
      patientQuery = patientQuery.eq('did', record.patient_did)
    }

    const { data: patient, error: patientError } = await patientQuery

    if (patientError || !patient?.public_key) {
      return res.status(404).json({ error: 'Patient or public key not found' })
    }

    // Skip verification if no signature stored
    if (!record.dilithium_signature) {
      return res.json({
        record_id,
        valid: null,
        message: 'No signature stored - record predates signing system',
        algorithm: 'none'
      })
    }

    // Prepare original record data for verification using stored record schema
    const recordPayload = {
      record_id: record.record_id,
      patient_id: record.patient_id,
      patient_did: record.patient_did,
      doctor_id: record.doctor_id,
      recorded_by: record.recorded_by,
      staff_id: record.staff_id,
      vitals: record.vitals,
      notes: record.notes,
      ai_prediction: record.ai_prediction,
      diagnosis_notes: record.diagnosis_notes,
      synced: record.synced,
      created_at: record.created_at
    }

    // Call verification service
    const verifyResult = await verifySignature(
      record.patient_id || record.patient_did,
      recordPayload,
      record.dilithium_signature,
      patient.public_key
    )

    if (verifyResult.success) {
      // Update verification timestamp
      await supabase
        .from('records')
        .update({ signature_verified_at: new Date().toISOString() })
        .eq('record_id', record_id)
        .catch(err => console.warn('[RECORDS] Failed to update verification timestamp:', err.message))

      return res.json({
        record_id,
        valid: verifyResult.valid,
        algorithm: verifyResult.algorithm || record.signing_algorithm,
        message: verifyResult.message,
        timestamp: record.created_at,
        verified_at: new Date().toISOString()
      })
    } else {
      return res.json({
        record_id,
        valid: false,
        algorithm: record.signing_algorithm,
        message: verifyResult.error || 'Verification failed',
        error: verifyResult.error
      })
    }
  } catch (err) {
    console.error('[RECORDS] Verify error:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/records/verify-batch
 * Verify multiple records at once (for audit reports)
 */
router.post('/verify-batch', async (req, res) => {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not initialized' })
    }

    const { record_ids } = req.body

    if (!Array.isArray(record_ids) || record_ids.length === 0) {
      return res.status(400).json({ error: 'record_ids array required' })
    }

    // Fetch all records
    const { data: records, error: recordsError } = await supabase
      .from('records')
      .select('*')
      .in('record_id', record_ids)

    if (recordsError) {
      return res.status(500).json({ error: 'Failed to fetch records' })
    }

    // Verify each record in parallel
    const verificationResults = await Promise.all(
      records.map(async (record) => {
        let patientQuery = supabase.from('patients').select('public_key').single()
        if (record.patient_id) {
          patientQuery = patientQuery.eq('id', record.patient_id)
        } else if (record.patient_did) {
          patientQuery = patientQuery.eq('did', record.patient_did)
        }

        const { data: patient } = await patientQuery

        if (!patient?.public_key || !record.dilithium_signature) {
          return {
            record_id: record.record_id,
            valid: null,
            message: 'Missing signature or patient key'
          }
        }

        const recordPayload = {
          record_id: record.record_id,
          patient_id: record.patient_id,
          patient_did: record.patient_did,
          doctor_id: record.doctor_id,
          recorded_by: record.recorded_by,
          staff_id: record.staff_id,
          vitals: record.vitals,
          notes: record.notes,
          ai_prediction: record.ai_prediction,
          diagnosis_notes: record.diagnosis_notes,
          synced: record.synced,
          created_at: record.created_at
        }

        const verifyResult = await verifySignature(
          record.patient_id || record.patient_did,
          recordPayload,
          record.dilithium_signature,
          patient.public_key
        )

        return {
          record_id: record.record_id,
          valid: verifyResult.valid,
          algorithm: verifyResult.algorithm || record.signing_algorithm,
          message: verifyResult.message
        }
      })
    )

    res.json({
      total: verificationResults.length,
      verified: verificationResults.filter(r => r.valid === true).length,
      invalid: verificationResults.filter(r => r.valid === false).length,
      unknown: verificationResults.filter(r => r.valid === null).length,
      results: verificationResults
    })
  } catch (err) {
    console.error('[RECORDS] Batch verify error:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router
