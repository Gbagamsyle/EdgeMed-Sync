import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Activity, BrainCircuit, History, Search, Stethoscope } from 'lucide-react'
import { getPatients } from '../../services/patientService'

const viewConfig = {
  assessments: { title: 'Diagnosis', label: 'Clinical diagnosis workspace', description: 'Select a patient to review current observations and document a diagnosis.', icon: Stethoscope },
  history: { title: 'Medical history', label: 'Patient history', description: 'Open a patient record to review longitudinal vitals and completed laboratory results.', icon: History },
  insights: { title: 'AI insights', label: 'Clinical decision support', description: 'Run a prediction from the latest patient vitals. AI output remains supporting evidence for the doctor.', icon: BrainCircuit },
}

export default function DoctorClinicalView({ routeView }) {
  const params = useParams()
  const view = routeView || params.view || 'assessments'
  const config = viewConfig[view] || viewConfig.assessments
  const [patients, setPatients] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const Icon = config.icon

  useEffect(() => {
    const loadPatients = async () => {
      const { data } = await getPatients()
      setPatients(data || [])
      setLoading(false)
    }
    void loadPatients()
  }, [])

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return patients
    return patients.filter((patient) => `${patient.full_name} ${patient.phone || ''} ${patient.email || ''}`.toLowerCase().includes(query))
  }, [patients, search])

  return (
    <div className="space-y-6">
      <header className="rounded-[1.75rem] bg-gradient-to-br from-sky-700 to-cyan-600 p-7 text-white shadow-sm"><div className="flex items-center gap-3"><Icon className="h-6 w-6" /><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-100">{config.label}</p><h1 className="mt-1 text-3xl font-bold">{config.title}</h1><p className="mt-2 text-sm text-sky-50">{config.description}</p></div></div></header>
+      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-slate-950">{view === 'assessments' ? 'Patients ready for diagnosis' : 'Patients'}</h2><p className="mt-1 text-sm text-slate-500">{view === 'assessments' ? 'Select a patient to review observations and document a diagnosis.' : 'Choose a patient to continue.'}</p></div><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search patients" aria-label="Search patients" className="rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-100" /></div></div>{loading ? <p className="mt-5 text-sm text-slate-500">Loading patients…</p> : <div className="mt-5 grid gap-3 md:grid-cols-2">{filteredPatients.map((patient) => <div key={patient.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"><div><p className="font-bold text-slate-950">{patient.full_name}</p><p className="mt-1 text-xs text-slate-500">{patient.phone || 'No phone'} · {patient.blood_group || 'Blood group not recorded'}</p></div><Link to={view === 'assessments' ? `/dashboard/diagnosis/${patient.id}` : view === 'history' ? `/dashboard/patients/${patient.id}/records` : `/dashboard/diagnosis/${patient.id}/predict`} className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 hover:bg-sky-100">{view === 'assessments' ? 'Open diagnosis' : view === 'history' ? 'Open history' : 'Diagnose'}<Activity className="h-3.5 w-3.5" /></Link></div>)}</div>}</section>
    </div>
  )
}
