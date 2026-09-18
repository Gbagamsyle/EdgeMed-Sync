import { useEffect, useState } from 'react'
import { ClipboardList, Search } from 'lucide-react'
import { getPatients } from '../../services/patientService'
import { createNursingObservation, getNursingObservations } from '../../services/workflowService'
import { useAuth } from '../../context/AuthContext'

export default function NursingObservations() {
  const { user } = useAuth()
  const [patients, setPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [observations, setObservations] = useState([])
  const [observation, setObservation] = useState('')
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    void getPatients().then(({ data }) => setPatients(data || []))
  }, [])

  useEffect(() => {
    if (selectedPatient) void getNursingObservations(selectedPatient.id).then(({ data }) => setObservations(data || []))
  }, [selectedPatient])

  const submit = async (event) => {
    event.preventDefault()
    if (!selectedPatient || !observation.trim()) return

    const { error } = await createNursingObservation({
      patient_id: selectedPatient.id,
      recorded_by: user.id,
      observation: observation.trim(),
    })

    if (error) {
      setMessage(error.message)
      return
    }

    setObservation('')
    setMessage('Observation saved.')
    const { data } = await getNursingObservations(selectedPatient.id)
    setObservations(data || [])
  }

  const searchTerm = search.trim().toLowerCase()
  const filtered = searchTerm
    ? patients.filter((patient) => String(patient.full_name || '').toLowerCase().includes(searchTerm))
    : []

  return (
    <div className="space-y-6">
      <header className="rounded-[1.75rem] bg-gradient-to-br from-sky-700 to-cyan-600 p-7 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-6 w-6" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-100">Nursing workspace</p>
            <h1 className="mt-1 text-3xl font-bold">Patient observations</h1>
            <p className="mt-2 text-sm text-sky-50">Record observations without changing the doctor’s diagnosis or treatment plan.</p>
          </div>
        </div>
      </header>

      {message ? <p role="status" className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">{message}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">Find patient</h2>
          <p className="mt-1 text-sm text-slate-500">Search by name to select a patient.</p>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search patient name" aria-label="Search patient name" className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-100" />
          </div>

          <div className="mt-4 space-y-2">
            {!searchTerm ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Start typing to find a patient.</p> : filtered.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No patients match “{search}”.</p> : filtered.map((patient) => <button type="button" key={patient.id} onClick={() => setSelectedPatient(patient)} className={`w-full rounded-xl border p-3 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-cyan-500 ${selectedPatient?.id === patient.id ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200 hover:border-cyan-300'}`}><span className="font-semibold text-slate-900">{patient.full_name}</span><span className="mt-1 block text-xs text-slate-500">{patient.phone || 'No phone'}</span></button>)}
          </div>
        </section>

        <section className="space-y-6">
          <form onSubmit={submit} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">{selectedPatient ? `Observation for ${selectedPatient.full_name}` : 'New observation'}</h2>
            <textarea required value={observation} onChange={(event) => setObservation(event.target.value)} disabled={!selectedPatient} rows="5" placeholder="Describe the patient’s current observation, response, or nursing concern" className="mt-4 w-full rounded-xl border border-slate-300 p-4 text-sm disabled:bg-slate-50" />
            <button disabled={!selectedPatient} className="mt-4 rounded-xl bg-cyan-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">Save observation</button>
          </form>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">Observation history</h2>
            {observations.length === 0 ? <p className="mt-4 text-sm text-slate-500">Select a patient to view nursing observations.</p> : <div className="mt-4 space-y-3">{observations.map((item) => <article key={item.id} className="border-l-2 border-cyan-300 pl-4"><p className="text-sm text-slate-700">{item.observation}</p><p className="mt-1 text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p></article>)}</div>}
          </div>
        </section>
      </div>
    </div>
  )
}
