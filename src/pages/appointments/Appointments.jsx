import { useEffect, useState } from 'react'
import { CalendarDays, Clock } from 'lucide-react'
import { getPatients } from '../../services/patientService'
import { createAppointment, getAppointments, updateAppointmentStatus } from '../../services/workflowService'
import { useAuth } from '../../context/AuthContext'

export default function Appointments() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [patients, setPatients] = useState([])
  const [form, setForm] = useState({ patient_id: '', scheduled_at: '', appointment_type: 'general consultation', notes: '' })
  const [message, setMessage] = useState('')

  const load = async () => {
    const [{ data: appointmentData }, { data: patientData }] = await Promise.all([getAppointments(), getPatients()])
    setAppointments(appointmentData || [])
    setPatients(patientData || [])
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load() }, [])

  const submit = async (event) => {
    event.preventDefault()
    const { error } = await createAppointment({ ...form, created_by: user.id, scheduled_at: new Date(form.scheduled_at).toISOString() })
    if (error) setMessage(error.message)
    else { setMessage('Appointment scheduled.'); setForm({ patient_id: '', scheduled_at: '', appointment_type: 'general consultation', notes: '' }); void load() }
  }

  const updateStatus = async (id, status) => { await updateAppointmentStatus(id, status); void load() }

  return <div className="space-y-6"><header className="rounded-[1.75rem] bg-gradient-to-br from-sky-700 to-cyan-600 p-7 text-white shadow-sm"><div className="flex items-center gap-3"><CalendarDays className="h-6 w-6" /><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-100">Front desk</p><h1 className="mt-1 text-3xl font-bold">Appointments</h1><p className="mt-2 text-sm text-sky-50">Schedule visits and manage patient check-in.</p></div></div></header>{message ? <p role="status" className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">{message}</p> : null}<div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]"><form onSubmit={submit} className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold text-slate-950">Schedule appointment</h2><select required value={form.patient_id} onChange={(event) => setForm({ ...form, patient_id: event.target.value })} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"><option value="">Select patient</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.full_name}</option>)}</select><input required type="datetime-local" value={form.scheduled_at} onChange={(event) => setForm({ ...form, scheduled_at: event.target.value })} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" /><input value={form.appointment_type} onChange={(event) => setForm({ ...form, appointment_type: event.target.value })} placeholder="Appointment type" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" /><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows="3" placeholder="Notes" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" /><button className="w-full rounded-xl bg-cyan-700 px-4 py-3 text-sm font-bold text-white hover:bg-cyan-800">Schedule visit</button></form><section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold text-slate-950">Upcoming visits</h2><div className="mt-5 divide-y divide-slate-100">{appointments.map((appointment) => <div key={appointment.id} className="flex items-center justify-between gap-4 py-4"><div><p className="font-bold text-slate-950">{appointment.patients?.full_name || 'Patient'}</p><p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><Clock className="h-3.5 w-3.5" />{new Date(appointment.scheduled_at).toLocaleString()}</p><p className="mt-1 text-xs capitalize text-slate-500">{appointment.appointment_type}</p></div><select value={appointment.status} onChange={(event) => void updateStatus(appointment.id, event.target.value)} className="rounded-lg border border-slate-300 px-2 py-1 text-xs capitalize"><option value="scheduled">Scheduled</option><option value="checked_in">Checked in</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>)}</div></section></div></div>
}
