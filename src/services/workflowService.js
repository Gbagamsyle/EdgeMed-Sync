import { supabase } from './supabaseClient'

export const getStaffProfiles = () => supabase.from('users').select('id, full_name, role, is_staff, created_at').order('created_at', { ascending: false })

export const updateStaffRole = (id, role) => supabase.from('users').update({ role }).eq('id', id).select().single()

export const getAppointments = () => supabase.from('appointments').select('*, patients(full_name)').order('scheduled_at', { ascending: true })

export const createAppointment = (appointment) => supabase.from('appointments').insert(appointment).select('*, patients(full_name)').single()

export const updateAppointmentStatus = (id, status) => supabase.from('appointments').update({ status }).eq('id', id).select().single()

export const getNursingObservations = (patientId) => supabase.from('nursing_observations').select('*, users(full_name)').eq('patient_id', patientId).order('created_at', { ascending: false })

export const createNursingObservation = (observation) => supabase.from('nursing_observations').insert(observation).select().single()