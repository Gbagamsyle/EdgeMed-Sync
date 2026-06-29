import express from 'express'
import { getSupabase } from '../services/supabaseClient.js'
import { requireStaff } from '../middleware/auth.js'

const router = express.Router()

/**
 * POST /api/audit/log
 * Body: { event_type, patient_id, patient_did, staff_id, staff_name, details }
 */
router.post('/log', async (req, res) => {
  try {
    const supabase = getSupabase()
    if (!supabase) return res.status(500).json({ error: 'Supabase not initialized' })

    const { event_type, patient_id, patient_did, staff_id, staff_name, details } = req.body

    if (!event_type || !patient_id) {
      return res.status(400).json({ error: 'event_type and patient_id required' })
    }

    const record = {
      event_type,
      patient_id,
      patient_did: patient_did || null,
      staff_id: staff_id || null,
      staff_name: staff_name || null,
      details: details ? JSON.stringify(details) : null,
      ip: req.ip,
      created_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('audit_logs')
      .insert([record])

    if (error) {
      console.error('[AUDIT] Insert error:', error)
      return res.status(500).json({ error: 'Failed to write audit log' })
    }

    res.json({ success: true, message: 'Audit logged' })
  } catch (err) {
    console.error('[AUDIT] Error:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/audit/logs
 * Protected: staff-only
 * Query params: limit, offset, patient_id, staff_id, event_type, start, end
 */
router.get('/logs', requireStaff, async (req, res) => {
  try {
    const supabase = getSupabase()
    if (!supabase) return res.status(500).json({ error: 'Supabase not initialized' })

    const { limit = 100, offset = 0, patient_id, staff_id, event_type, start, end } = req.query

    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1)

    if (patient_id) query = query.eq('patient_id', patient_id)
    if (staff_id) query = query.eq('staff_id', staff_id)
    if (event_type) query = query.eq('event_type', event_type)
    if (start) query = query.gte('created_at', start)
    if (end) query = query.lte('created_at', end)

    const { data, error } = await query

    if (error) {
      console.error('[AUDIT] Fetch logs error:', error)
      return res.status(500).json({ error: 'Failed to fetch audit logs' })
    }

    res.json({ logs: data || [] })
  } catch (err) {
    console.error('[AUDIT] Logs error:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router
