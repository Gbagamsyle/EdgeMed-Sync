/* eslint-env node */
import express from 'express'
import { getSupabase } from '../services/supabaseClient.js'

const router = express.Router()

/**
 * POST /api/sync/push
 * Push queued records to cloud/Fog when connectivity returns
 * TODO: Implement full sync queue system
 */
router.post('/push', async (req, res) => {
  try {
    const supabase = getSupabase()
    if (!supabase) return res.status(500).json({ error: 'Supabase not initialized' })

    const { records } = req.body

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'records array required' })
    }

    // Mark records as synced
    const { error: updateError } = await supabase
      .from('records')
      .update({ synced: true })
      .in('record_id', records.map(r => r.record_id))

    if (updateError) {
      return res.status(500).json({ error: 'Sync failed' })
    }

    res.json({
      synced_count: records.length,
      message: 'Records synced successfully'
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

    const { data: records, error } = await supabase
      .from('records')
      .select('*')
      .eq('synced', false)
      .order('created_at', { ascending: true })

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

export default router
