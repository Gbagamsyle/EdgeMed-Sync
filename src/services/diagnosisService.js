import { API_BASE } from './config'

const normalizePrediction = (payload) => {
  const label =
    payload?.label ||
    payload?.disease ||
    payload?.prediction ||
    payload?.result ||
    payload?.diagnosis ||
    payload?.class_name ||
    'No prediction'

  return {
    ...payload,
    label,
    confidence:
      typeof payload?.confidence === 'number'
        ? payload.confidence
        : typeof payload?.confidence_score === 'number'
          ? payload.confidence_score
          : null,
  }
}

export const diagnosisService = {
  analyze: async (vitals) => {
    const response = await fetch(`${API_BASE}/ai/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ vitals }),
    })

    const payload = await response.json()

    if (!response.ok) {
      throw new Error(payload.error || 'Unable to analyze vitals')
    }

    return normalizePrediction(payload)
  },

  checkStatus: async () => {
    const response = await fetch(`${API_BASE}/ai/status`)
    const payload = await response.json()

    if (!response.ok) {
      throw new Error(payload.error || 'Unable to check AI service')
    }

    return payload
  },

  saveDiagnosis: async ({ patient_did, doctor_id, vitals, diagnosis_notes, recorded_by }) => {
    const response = await fetch(`${API_BASE}/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        patient_did,
        doctor_id,
        vitals,
        diagnosis_notes,
        recorded_by,
      }),
    })

    const payload = await response.json()

    if (!response.ok) {
      throw new Error(payload.error || 'Unable to save diagnosis record')
    }

    return payload
  },
}
