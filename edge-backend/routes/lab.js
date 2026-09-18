import express from 'express'
import { requireStaff } from '../middleware/auth.js'
import { getSupabase } from '../services/supabaseClient.js'

const router = express.Router()

const getRole = (req) => String(req.user?.profile?.role || req.user?.role || '').trim().toLowerCase()
const getUserId = (req) => req.user?.id || req.user?.sub || req.user?.profile?.id

const requireRole = (role) => (req, res, next) => {
  if (getRole(req) === role) return next()
  return res.status(403).json({ error: `${role.replace('_', ' ')} access required` })
}

const getRequestWithPatient = async (supabase, requestId) => {
  const { data: request, error } = await supabase
    .from('lab_requests')
    .select('*')
    .eq('id', requestId)
    .single()

  if (error || !request) return { request: null, error }

  const [{ data: patient }, { data: requester }] = await Promise.all([
    supabase.from('patients').select('id, full_name').eq('id', request.patient_id).single(),
    supabase.from('users').select('id, full_name').eq('id', request.requested_by).single(),
  ])

  return { request: { ...request, patient, requester }, error: null }
}

router.use(requireStaff)

router.post('/requests', requireRole('doctor'), async (req, res) => {
  const { patient_id, test_name, test_category, clinical_notes } = req.body || {}
  if (!patient_id || !String(test_name || '').trim() || !String(test_category || '').trim()) {
    return res.status(400).json({ error: 'patient_id, test_name, and test_category are required' })
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('lab_requests')
    .insert({
      patient_id,
      requested_by: getUserId(req),
      test_name: String(test_name).trim(),
      test_category: String(test_category).trim(),
      clinical_notes: clinical_notes ? String(clinical_notes).trim() : null,
    })
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })
  return res.status(201).json({ request: data })
})

router.get('/requests/queue', requireRole('lab_technician'), async (req, res) => {
  const supabase = getSupabase()
  const { data: requests, error } = await supabase
    .from('lab_requests')
    .select('*')
    .in('status', ['pending', 'in_progress'])
    .order('requested_at', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })

  const enriched = await Promise.all((requests || []).map(async (request) => {
    const { request: fullRequest } = await getRequestWithPatient(supabase, request.id)
    return fullRequest || request
  }))

  return res.json({ requests: enriched })
})

router.get('/results', requireRole('lab_technician'), async (req, res) => {
  const supabase = getSupabase()
  const { data: results, error } = await supabase
    .from('lab_results')
    .select('*')
    .eq('recorded_by', getUserId(req))
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })

  const enriched = await Promise.all((results || []).map(async (result) => {
    const { data: patient } = await supabase.from('patients').select('full_name').eq('id', result.patient_id).maybeSingle()
    return { ...result, patient }
  }))

  return res.json({ results: enriched })
})

router.get('/requests/:requestId', requireRole('lab_technician'), async (req, res) => {
  const supabase = getSupabase()
  const { request, error } = await getRequestWithPatient(supabase, req.params.requestId)

  if (error || !request) return res.status(404).json({ error: 'Laboratory request not found' })
  return res.json({ request })
})

router.get('/patients/:patientId/requests', requireRole('doctor'), async (req, res) => {
  const supabase = getSupabase()
  const { data: requests, error } = await supabase
    .from('lab_requests')
    .select('*')
    .eq('patient_id', req.params.patientId)
    .order('requested_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })

  const enriched = await Promise.all((requests || []).map(async (request) => {
    const { data: result } = await supabase
      .from('lab_results')
      .select('id, result_value, unit, reference_range, status, notes, created_at, recorded_by')
      .eq('request_id', request.id)
      .maybeSingle()

    return { ...request, result }
  }))

  return res.json({ requests: enriched })
})

router.post('/requests/:requestId/result', requireRole('lab_technician'), async (req, res) => {
  const { requestId } = req.params
  const { result_value, unit, reference_range, status = 'normal', notes } = req.body || {}
  if (!String(result_value || '').trim()) return res.status(400).json({ error: 'result_value is required' })
  if (!['normal', 'abnormal', 'critical', 'positive', 'negative'].includes(status)) {
    return res.status(400).json({ error: 'Invalid result status' })
  }

  const supabase = getSupabase()
  const { data: request, error: requestError } = await supabase
    .from('lab_requests')
    .select('*')
    .eq('id', requestId)
    .in('status', ['pending', 'in_progress'])
    .single()

  if (requestError || !request) return res.status(404).json({ error: 'Open laboratory request not found' })

  const { data: result, error } = await supabase
    .from('lab_results')
    .insert({
      request_id: request.id,
      patient_id: request.patient_id,
      recorded_by: getUserId(req),
      test_name: request.test_name,
      test_category: request.test_category,
      result_value: String(result_value).trim(),
      unit: unit ? String(unit).trim() : null,
      reference_range: reference_range ? String(reference_range).trim() : null,
      status,
      notes: notes ? String(notes).trim() : null,
    })
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })

  const { error: updateError } = await supabase
    .from('lab_requests')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', request.id)

  if (updateError) return res.status(500).json({ error: updateError.message })
  return res.status(201).json({ result })
})

router.get('/patients/:patientId/results', requireRole('doctor'), async (req, res) => {
  const supabase = getSupabase()
  const { data: results, error } = await supabase
    .from('lab_results')
    .select('*')
    .eq('patient_id', req.params.patientId)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })

  const enriched = await Promise.all((results || []).map(async (result) => {
    const [{ data: request }, { data: technician }] = await Promise.all([
      supabase.from('lab_requests').select('requested_by, test_name, clinical_notes').eq('id', result.request_id).maybeSingle(),
      supabase.from('users').select('full_name').eq('id', result.recorded_by).maybeSingle(),
    ])
    return { ...result, request, technician }
  }))

  return res.json({ results: enriched })
})

export default router