import { supabase } from './supabaseClient'

// Create a new vital record
export const createVital = async (patientId, vitalData, userId) => {
  // Calculate BMI if height and weight are provided
  let bmi = null
  if (vitalData.height_cm && vitalData.weight_kg) {
    const heightM = vitalData.height_cm / 100
    bmi = parseFloat((vitalData.weight_kg / (heightM * heightM)).toFixed(2))
  }

  const payload = {
    patient_id: patientId,
    recorded_by: userId,
    ...vitalData,
    bmi
  }

  return await supabase
    .from('vitals')
    .insert([payload])
    .select()
    .single()
}

// Get all vitals for a patient
export const getPatientVitals = async (patientId, limit = 50) => {
  return await supabase
    .from('vitals')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(limit)
}

// Get latest vital for a patient
export const getLatestVital = async (patientId) => {
  return await supabase
    .from('vitals')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
}

// Update a vital record
export const updateVital = async (vitalId, vitalData) => {
  return await supabase
    .from('vitals')
    .update(vitalData)
    .eq('id', vitalId)
    .select()
    .single()
}

// Delete a vital record
export const deleteVital = async (vitalId) => {
  return await supabase
    .from('vitals')
    .delete()
    .eq('id', vitalId)
}

// Get vitals within date range
export const getVitalsByDateRange = async (patientId, startDate, endDate) => {
  return await supabase
    .from('vitals')
    .select('*')
    .eq('patient_id', patientId)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false })
}

// Helper: Determine vital status (normal, warning, critical)
export const getVitalStatus = (vital, vitalType) => {
  const ranges = {
    temperature_celsius: { normal: [36.5, 37.5], warning: [35.5, 38.5], critical: [35, 43] },
    systolic_bp: { normal: [90, 120], warning: [120, 140], critical: [60, 250] },
    diastolic_bp: { normal: [60, 80], warning: [80, 90], critical: [40, 180] },
    heart_rate: { normal: [60, 100], warning: [50, 120], critical: [30, 200] },
    respiratory_rate: { normal: [12, 20], warning: [10, 25], critical: [5, 60] },
    oxygen_saturation: { normal: [95, 100], warning: [90, 95], critical: [50, 100] },
    bmi: { normal: [18.5, 24.9], warning: [25, 29.9], critical: [0, 50] }
  }

  const value = vital[vitalType]
  if (value === null || value === undefined) return 'unknown'

  const range = ranges[vitalType]
  if (!range) return 'unknown'

  if (value >= range.normal[0] && value <= range.normal[1]) return 'normal'
  if (value >= range.warning[0] && value <= range.warning[1]) return 'warning'
  return 'critical'
}

// Helper: Format vital value with unit
export const formatVital = (vital, vitalType) => {
  const units = {
    temperature_celsius: '°C',
    systolic_bp: 'mmHg',
    diastolic_bp: 'mmHg',
    heart_rate: 'bpm',
    respiratory_rate: 'breaths/min',
    oxygen_saturation: '%',
    weight_kg: 'kg',
    height_cm: 'cm',
    bmi: 'kg/m²'
  }

  const value = vital[vitalType]
  return value !== null && value !== undefined ? `${value} ${units[vitalType] || ''}` : 'N/A'
}
