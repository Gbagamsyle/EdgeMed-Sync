/* eslint-env node */
import express from 'express'
import { randomUUID } from 'crypto'
import { getSupabase } from '../services/supabaseClient.js'
import { sha256Hash } from '../services/hashing.js'
import { signRecord, fallbackSignRecord } from '../services/dilithiumSigning.js'

const router = express.Router()

/**
 * POST /api/sync/push
 * Push queued records to the backend and create or sync queued offline payloads.
 */
router.post('/push', async (req, res) => {
  try {
    const supabase = getSupabase()
    if (!supabase) return res.status(500).json({ error: 'Supabase not initialized' })

    const { records } = req.body

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'records array required' })
    }

    const results = await Promise.all(records.map(async (record) => {
      const recordId = record.record_id || randomUUID()

      try {
        const { data: existingRecord, error: fetchError } = await supabase
          .from('records')
          .select('*')
          .eq('record_id', recordId)
          .single()

        if (!fetchError && existingRecord) {
          if (!existingRecord.synced) {
            const { error: updateError } = await supabase
              .from('records')
              .update({ synced: true })
              .eq('record_id', recordId)

            if (updateError) {
              throw new Error('Failed to mark existing record as synced')
            }
          }

          return { record_id: recordId, status: 'already_exists', synced: true }
        }

        const patientId = record.patient_id || record.patientId || null
        const patientDid = record.patient_did || record.patientDID || null
        const doctorId = record.doctor_id || record.doctorId || null
        const recordedBy = record.recorded_by || record.staff_id || record.staffId || null
        const staffId = record.staff_id || record.staffId || null
        const vitals = record.vitals || null
        const notes = record.notes ?? record.note ?? null
        const diagnosisNotes = record.diagnosis_notes || record.diagnosisNotes || null
        const aiPrediction = record.ai_prediction || record.aiPrediction || { label: 'No prediction', confidence: 0 }
        const createdAt = record.created_at || record.createdAt || new Date().toISOString()

        if (!vitals) {
          throw new Error('Record vitals are required')
        }

        if (!patientId && !patientDid) {
          throw new Error('patient_id or patient_did is required')
        }

        const recordPayload = {
          record_id: recordId,
          patient_id: patientId,
          patient_did: patientDid,
          doctor_id: doctorId,
          recorded_by: recordedBy,
          staff_id: staffId,
          vitals,
          notes,
          diagnosis_notes: diagnosisNotes,
          ai_prediction: aiPrediction,
          synced: true,
          created_at: createdAt
        }

        recordPayload.sha256_hash = sha256Hash(recordPayload)

        let signature = null
        let algorithm = null

        try {
          const signResult = await signRecord(patientId || patientDid, recordPayload)
          if (signResult.success) {
            signature = signResult.signature
            algorithm = signResult.algorithm
          } else {
            const fallbackResult = fallbackSignRecord(recordPayload)
            signature = fallbackResult.signature
            algorithm = fallbackResult.algorithm
          }
        } catch {
          const fallbackResult = fallbackSignRecord(recordPayload)
          signature = fallbackResult.signature
          algorithm = fallbackResult.algorithm
        }

        const { error: insertError } = await supabase
          .from('records')
          .insert([
            {
              record_id: recordId,
              patient_id: patientId,
              patient_did: patientDid,
              doctor_id: doctorId,
              recorded_by: recordedBy,
              staff_id: staffId,
              vitals,
              notes,
              diagnosis_notes: diagnosisNotes,
              ai_prediction: aiPrediction,
              sha256_hash: recordPayload.sha256_hash,
              dilithium_signature: signature,
              signing_algorithm: algorithm,
              synced: true,
              created_at: createdAt
            }
          ])

        if (insertError) {
          throw new Error(insertError.message || 'Failed to insert synced record')
        }

        return { record_id: recordId, status: 'created', synced: true }
      } catch (err) {
        return { record_id: recordId, status: 'failed', error: err.message }
      }
    }))

    const syncedCount = results.filter((result) => result.synced === true).length
    const failedCount = results.filter((result) => result.status === 'failed').length

    res.json({
      total: records.length,
      synced_count: syncedCount,
      failed_count: failedCount,
      results
    })
  } catch (err) {
    console.error('[SYNC] Push error:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/sync/queue
 * Get pending records to sync
 */
router.get('/queue', async (req, res) => {
  try {
    const supabase = getSupabase()
    if (!supabase) return res.status(500).json({ error: 'Supabase not initialized' })

    const { limit = 100, offset = 0 } = req.query

    const { data: records, error } = await supabase
      .from('records')
      .select('*')
      .eq('synced', false)
      .order('created_at', { ascending: true })
      .range(Number(offset), Number(offset) + Number(limit) - 1)

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch queue' })
    }

    res.json({
      queue_length: records?.length || 0,
      records: records || []
    })
  } catch (err) {
    console.error('[SYNC] Queue error:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/sync/status
 * Returns counts for queued, synced and total records
 */
router.get('/status', async (req, res) => {
  try {
    const supabase = getSupabase()
    if (!supabase) return res.status(500).json({ error: 'Supabase not initialized' })

    const [{ count: totalCount }, { count: syncedCount }, { count: queuedCount }] = await Promise.all([
      supabase.from('records').select('record_id', { count: 'estimated', head: true }),
      supabase.from('records').select('record_id', { count: 'estimated', head: true }).eq('synced', true),
      supabase.from('records').select('record_id', { count: 'estimated', head: true }).eq('synced', false)
    ])

    res.json({
      total: totalCount || 0,
      synced: syncedCount || 0,
      queued: queuedCount || 0
    })
  } catch (err) {
    console.error('[SYNC] Status error:', err)
    res.status(500).json({ error: err.message })
  }
})


/**
 * GET /api/sync/failed
 * Returns a list of queued (unsynced) records to inspect failures
 */
router.get('/failed', async (req, res) => {
  try {
    const supabase = getSupabase()
    if (!supabase) return res.status(500).json({ error: 'Supabase not initialized' })

    const { limit = 50 } = req.query
    const { data: records, error } = await supabase
      .from('records')
      .select('*')
      .eq('synced', false)
      .order('created_at', { ascending: true })
      .limit(Number(limit))

    if (error) return res.status(500).json({ error: 'Failed to fetch failed/pending records' })

    res.json({ count: records?.length || 0, records: records || [] })
  } catch (err) {
    console.error('[SYNC] Failed list error:', err)
    res.status(500).json({ error: err.message })
  }
})


/**
 * POST /api/sync/retry
 * Retry syncing specific records by record_id (array) or all queued when empty
 */
router.post('/retry', async (req, res) => {
  try {
    const supabase = getSupabase()
    if (!supabase) return res.status(500).json({ error: 'Supabase not initialized' })

    let { record_ids } = req.body
    if (record_ids && !Array.isArray(record_ids)) {
      return res.status(400).json({ error: 'record_ids must be an array' })
    }

    // If no ids provided, operate on the queued set
    if (!record_ids || record_ids.length === 0) {
      const { data: queued } = await supabase
        .from('records')
        .select('record_id')
        .eq('synced', false)
        .order('created_at', { ascending: true })

      record_ids = (queued || []).map(r => r.record_id)
    }

    const results = await Promise.all(record_ids.map(async (rid) => {
      try {
        const { data: rec, error: fetchError } = await supabase
          .from('records')
          .select('*')
          .eq('record_id', rid)
          .single()

        if (fetchError || !rec) return { record_id: rid, status: 'not_found' }
        if (rec.synced) return { record_id: rid, status: 'already_synced' }

        // Attempt to re-sign and mark synced
        const payload = { ...rec }
        // remove DB fields not part of payload
        delete payload.id
        delete payload.created_at
        delete payload.synced

        // compute hash and sign
        payload.sha256_hash = sha256Hash(payload)
        let signRes = null
        try {
          signRes = await signRecord(rec.patient_id || rec.patient_did, payload)
        } catch {
          signRes = fallbackSignRecord(payload)
        }

        const { error: updateError } = await supabase
          .from('records')
          .update({
            sha256_hash: payload.sha256_hash,
            dilithium_signature: signRes.signature || null,
            signing_algorithm: signRes.algorithm || null,
            synced: true
          })
          .eq('record_id', rid)

        if (updateError) throw new Error(updateError.message || 'Failed to update record')

        return { record_id: rid, status: 'synced' }
      } catch (err) {
        return { record_id: rid, status: 'failed', error: err.message }
      }
    }))

    res.json({ total: record_ids.length, results })
  } catch (err) {
    console.error('[SYNC] Retry error:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router
