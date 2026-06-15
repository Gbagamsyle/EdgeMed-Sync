import { supabase } from './supabaseClient'

export const createPatient = async (patient) => {
  const { data, error } = await supabase
    .from('patients')
    .insert([patient])
    .select()
    .single()

  if (error) return { error }

  return { data }
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
