import { supabase } from './supabaseClient'
import { API_BASE } from './config'

const request = async (path, options = {}) => {
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || 'Laboratory request failed')
  return payload
}

export const createLabRequest = (payload) => request('/lab/requests', {
  method: 'POST',
  body: JSON.stringify(payload),
})

export const getLabQueue = () => request('/lab/requests/queue')

export const getLabResults = () => request('/lab/results')

export const getLabRequest = (requestId) => request(`/lab/requests/${requestId}`)

export const getPatientLabRequests = (patientId) => request(`/lab/patients/${patientId}/requests`)

export const submitLabResult = (requestId, payload) => request(`/lab/requests/${requestId}/result`, {
  method: 'POST',
  body: JSON.stringify(payload),
})

export const getPatientLabResults = (patientId) => request(`/lab/patients/${patientId}/results`)