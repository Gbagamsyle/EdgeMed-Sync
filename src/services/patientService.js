import { supabase } from './supabaseClient'
import { generateQRCode } from '../utils/generateQR'

export const createPatient = async (patient) => {
  // Step 1: insert patient
  const { data, error } = await supabase
    .from('patients')
    .insert([patient])
    .select()
    .single()

  if (error) return { error }

  // Step 2: generate QR using patient ID
  const qr = await generateQRCode(data.id)
  if (!qr) return { error: new Error('QR generation failed') }

  // Step 3: update patient with QR
  const { error: updateError } = await supabase
    .from('patients')
    .update({ qr_code: qr })
    .eq('id', data.id)

  if (updateError) return { error: updateError }

  return { data: { ...data, qr_code: qr } }
}

export const getPatients = async () => {
  return await supabase.from('patients').select('*').order('created_at', { ascending: false })
}

export const getPatientById = async (id) => {
  return await supabase.from('patients').select('*').eq('id', id).single()
}

export const updatePatient = async (id, payload) => {
  return await supabase.from('patients').update(payload).eq('id', id).select().single()
}
