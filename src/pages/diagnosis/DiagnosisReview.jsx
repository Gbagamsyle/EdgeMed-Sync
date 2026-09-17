import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Activity, Check, ClipboardList, FlaskConical } from 'lucide-react'
import Button from '../../components/ui/Button'
import { diagnosisService } from '../../services/diagnosisService'
import { getPatientById } from '../../services/patientService'
import { getPatientVitals } from '../../services/vitalsService'
import { createLabRequest, getPatientLabRequests } from '../../services/labService'

const initialForm = {
  diagnosis_notes: '',
  final_diagnosis: '',
  confidence_score: '0.8',
  treatment_plan: '',
  prescription: '',
  referral: '',
  patient_consent: false,
  doctor_override: false,
  confirmed: false,
}

const testOptions = [
  { id: 'fbc', name: 'Full Blood Count', category: 'haematology', detail: 'Haemoglobin, PCV, WBC and platelets' },
  { id: 'malaria', name: 'Malaria Parasite', category: 'microbiology', detail: 'Screen for malaria parasites' },
  { id: 'glucose', name: 'Blood Glucose', category: 'biochemistry', detail: 'Fasting or random blood sugar' },
  { id: 'urinalysis', name: 'Urinalysis', category: 'urinalysis', detail: 'Routine urine chemistry and microscopy' },
  { id: 'renal', name: 'Urea and Creatinine', category: 'biochemistry', detail: 'Kidney function markers' },
  { id: 'other', name: 'Other investigation', category: 'other', detail: 'Specify in the clinical notes' },
]

const normalizeVitals = (vital) => ({
  heart_rate: vital?.heart_rate ?? 0,
  systolic_bp: vital?.systolic_bp ?? 0,
  diastolic_bp: vital?.diastolic_bp ?? 0,
  spo2: vital?.oxygen_saturation ?? 0,
  temperature: vital?.temperature_celsius ?? 0,
  resp_rate: vital?.respiratory_rate ?? 0,
})

export default function DiagnosisReview() {
  const { patientId } = useParams()
  const { user, profile } = useAuth()
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [vitalHistory, setVitalHistory] = useState([])
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [predictionLoading, setPredictionLoading] = useState(false)
  const [error, setError] = useState('')
  const [predictionError, setPredictionError] = useState('')
  const [predictionResult, setPredictionResult] = useState(null)
  const [serviceStatus, setServiceStatus] = useState('checking')
  const [selectedTests, setSelectedTests] = useState(['fbc'])
  const [clinicalNotes, setClinicalNotes] = useState('')
  const [labStatus, setLabStatus] = useState({ type: '', text: '' })
  const [labLoading, setLabLoading] = useState(false)
  const [labRequests, setLabRequests] = useState([])
  const [labRequestsLoading, setLabRequestsLoading] = useState(false)
  const [diagnosisHistory, setDiagnosisHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    const loadPatient = async () => {
      if (!patientId) return
      const { data, error } = await getPatientById(patientId)
      if (!error) {
        setSelectedPatient(data)
      }
    }

    void loadPatient()
  }, [patientId])

  const loadLabRequests = useCallback(async () => {
    if (!patientId) return
    setLabRequestsLoading(true)
    try {
      const payload = await getPatientLabRequests(patientId)
      setLabRequests(payload.requests || [])
    } catch {
      setLabRequests([])
    } finally {
      setLabRequestsLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    void loadLabRequests()
  }, [loadLabRequests])

  useEffect(() => {
    if (!selectedPatient?.did) return undefined

    let isMounted = true
    setHistoryLoading(true)
    diagnosisService.getPatientHistory(selectedPatient.did)
      .then((records) => {
        if (isMounted) setDiagnosisHistory(records)
      })
      .catch(() => {
        if (isMounted) setDiagnosisHistory([])
      })
      .finally(() => {
        if (isMounted) setHistoryLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [selectedPatient?.did])

  useEffect(() => {
    const loadVitals = async () => {
      if (!patientId) return
      const { data, error } = await getPatientVitals(patientId, 20)
      if (!error) {
        setVitalHistory(data || [])
      }
    }

    void loadVitals()
  }, [patientId])

  useEffect(() => {
    let isMounted = true

    const checkService = async () => {
      try {
        const status = await diagnosisService.checkStatus()
        if (!isMounted) return

        setServiceStatus(status?.status === 'online' ? 'online' : 'offline')
      } catch {
        if (!isMounted) return
        setServiceStatus('offline')
      }
    }

    void checkService()
    return () => {
      isMounted = false
    }
  }, [])

  const latestVital = vitalHistory[0] || null

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const runPrediction = async () => {
    if (!latestVital) {
      setPredictionError('No vitals available for prediction.')
      setPredictionResult(null)
      return
    }

    setPredictionLoading(true)
    setPredictionError('')
    setPredictionResult(null)

    try {
      const normalizedVitals = normalizeVitals(latestVital)
      const response = await diagnosisService.analyze(normalizedVitals)
      setPredictionResult(response)
    } catch (err) {
      setPredictionError(err.message || 'Prediction failed.')
    } finally {
      setPredictionLoading(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!selectedPatient) {
      setError('No patient selected.')
      return
    }

    if (!latestVital) {
      setError('No vitals recorded for this patient yet.')
      return
    }

    if (!selectedPatient.did) {
      setError('This patient has no registered DID. Register the patient identity before saving a diagnosis.')
      return
    }

    if (!form.confirmed) {
      setError('Please confirm that you reviewed the latest vitals.')
      return
    }

    if (!form.final_diagnosis.trim()) {
      setError('Please enter a final diagnosis before saving.')
      return
    }

    if (!form.patient_consent) {
      setError('Please confirm that the patient consented to the clinical review.')
      return
    }

    setLoading(true)

    try {
      const normalizedVitals = normalizeVitals(latestVital)
      await diagnosisService.saveDiagnosis({
        patient_did: selectedPatient.did,
        doctor_id: user?.id || profile?.id,
        vitals: normalizedVitals,
        diagnosis_notes: form.diagnosis_notes,
        recorded_by: user?.id || profile?.id,
        final_diagnosis: form.final_diagnosis.trim(),
        confidence_score: Number(form.confidence_score) || 0,
        treatment_plan: form.treatment_plan.trim(),
        prescription: form.prescription.trim(),
        referral: form.referral.trim(),
        patient_consent: form.patient_consent,
        doctor_override: form.doctor_override,
      })
    } catch (err) {
      setError(err.message || 'Unable to save diagnosis record.')
    } finally {
      setLoading(false)
    }
  }

  const requestLabTest = async (event) => {
    event.preventDefault()
    if (!selectedPatient || selectedTests.length === 0) {
      setLabStatus({ type: 'error', text: 'Select at least one investigation first.' })
      return
    }
    setLabLoading(true)
    setLabStatus({ type: '', text: '' })
    try {
      const selectedOptions = testOptions.filter((test) => selectedTests.includes(test.id))
      await Promise.all(selectedOptions.map((test) => createLabRequest({
        patient_id: selectedPatient.id,
        test_name: test.name,
        test_category: test.category,
        clinical_notes: clinicalNotes,
      })))
      setLabStatus({ type: 'success', text: `${selectedOptions.length} investigation${selectedOptions.length === 1 ? '' : 's'} sent to the laboratory.` })
      setClinicalNotes('')
      await loadLabRequests()
    } catch (err) {
      setLabStatus({ type: 'error', text: err.message || 'Unable to create laboratory request.' })
    } finally {
      setLabLoading(false)
    }
  }

  return (
    <div className="space-y-7">
      <header className="relative overflow-hidden rounded-[1.35rem] bg-gradient-to-br from-sky-700 via-sky-600 to-cyan-600 px-5 py-4 text-white shadow-[0_18px_45px_-26px_rgba(14,116,144,0.65)] sm:px-7 sm:py-5">
        <div className="absolute inset-y-0 right-0 w-1/3 bg-white/5" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 text-cyan-100"><span className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" /><span className="text-[10px] font-bold uppercase tracking-[0.18em]">Clinical workspace</span></span><span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"><span className={`h-1.5 w-1.5 rounded-full ${serviceStatus === 'online' ? 'bg-emerald-300' : 'bg-amber-300'}`} />AI {serviceStatus === 'online' ? 'online' : 'offline'}</span></div>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl">Diagnosis review</h1>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-sky-50 sm:text-sm">Examine the patient, request the investigations you need, then document a considered clinical decision.</p>
          </div>
          <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-white/20 bg-white/15 px-3 py-2 backdrop-blur lg:min-w-[19rem]">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white"><ClipboardList className="h-4 w-4" /></div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-sky-100">Patient under review</p>
              <p className="truncate text-sm font-bold text-white">{selectedPatient?.full_name || 'Loading patient…'}</p>
              <p className="truncate text-[11px] text-sky-100">{selectedPatient ? `${selectedPatient.gender || 'Gender not recorded'} · Blood group ${selectedPatient.blood_group || 'not recorded'}` : 'Retrieving patient record'}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-8">
        <div className="grid gap-8 xl:grid-cols-2">
          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Current observations</p><h2 className="mt-2 text-xl font-bold text-slate-950">Latest vitals</h2></div><Activity className="h-5 w-5 text-cyan-600" /></div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[['Temperature', `${latestVital?.temperature_celsius ?? '—'}°C`], ['Heart rate', `${latestVital?.heart_rate ?? '—'} bpm`], ['Blood pressure', latestVital?.systolic_bp && latestVital?.diastolic_bp ? `${latestVital.systolic_bp}/${latestVital.diastolic_bp}` : '—'], ['O₂ saturation', `${latestVital?.oxygen_saturation ?? '—'}%`]].map(([label, value]) => <div key={label} className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-2 text-xl font-bold text-slate-950">{value}</p></div>)}
            </div>
            <p className="mt-4 text-xs text-slate-500">{latestVital ? `Recorded ${new Date(latestVital.created_at).toLocaleString()}` : 'No vitals recorded yet'}</p>
          </section>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Clinical history</p><h2 className="mt-1.5 text-xl font-bold text-slate-950">Previous diagnoses</h2></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{diagnosisHistory.length}</span></div>
            {historyLoading ? <p className="mt-4 text-sm text-slate-500">Loading diagnosis history…</p> : diagnosisHistory.length === 0 ? <p className="mt-4 text-sm text-slate-500">No previous diagnoses recorded for this patient.</p> : (
              <div className="mt-4 space-y-4">
                {diagnosisHistory.slice(0, 4).map((record) => (
                  <article key={record.record_id || record.id} className="border-l-2 border-sky-200 pl-4">
                    <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-bold text-slate-900">{record.final_diagnosis || 'Diagnosis recorded'}</h3><time className="text-xs text-slate-500">{record.created_at ? new Date(record.created_at).toLocaleDateString() : 'Date unavailable'}</time></div>
                    {record.diagnosis_notes ? <p className="mt-1 text-sm leading-5 text-slate-600">{record.diagnosis_notes}</p> : null}
                    {record.treatment_plan ? <p className="mt-2 text-xs text-slate-500"><span className="font-semibold text-slate-700">Treatment:</span> {record.treatment_plan}</p> : null}
                    {record.confidence_score !== null && record.confidence_score !== undefined ? <p className="mt-1 text-xs text-slate-500">Confidence: {Math.round(Number(record.confidence_score) * 100)}%</p> : null}
                  </article>
                ))}
                {diagnosisHistory.length > 4 ? <p className="text-xs font-semibold text-sky-700">Showing the four most recent diagnoses.</p> : null}
              </div>
            )}
          </section>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Clinical support</p>
                <h2 className="mt-1 text-lg font-bold text-slate-950">AI prediction</h2>
              </div>
              <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">Decision aid</span>
            </div>
            <p id="prediction-help" className="mt-3 text-xs leading-5 text-slate-600">Use the latest vitals as supporting evidence. The treating doctor remains responsible for the final diagnosis.</p>
            <div className="mt-3 grid gap-2 border-t border-slate-100 pt-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">What it reviews</p>
                <p className="mt-1 text-xs leading-5 text-slate-700">Heart rate, blood pressure, temperature, oxygen saturation, and respiratory rate.</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">How to use it</p>
                <p className="mt-1 text-xs leading-5 text-slate-700">Compare the suggestion with symptoms, examination findings, and laboratory results.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={runPrediction}
              disabled={predictionLoading || !latestVital}
              aria-describedby="prediction-help"
              className="mt-4 flex min-h-11 w-full items-center justify-center rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 disabled:shadow-none"
            >
              {predictionLoading ? 'Analyzing vitals…' : latestVital ? 'View AI prediction' : 'Record vitals to enable prediction'}
            </button>
            {!latestVital ? <p className="mt-2 text-[11px] text-slate-500">Record patient vitals to enable prediction.</p> : null}
            {predictionError ? <p role="alert" className="mt-3 text-sm text-rose-700">{predictionError}</p> : null}
            {predictionResult ? <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Suggested pattern</p><p className="mt-1 text-base font-bold text-slate-950">{predictionResult.label || 'No prediction'}</p><p className="mt-1 text-xs text-slate-600">Confidence: {typeof predictionResult.confidence === 'number' ? `${Math.round(predictionResult.confidence * 100)}%` : 'N/A'}{predictionResult.severity ? ` · ${predictionResult.severity}` : ''}</p></div> : null}
          </section>
        </div>

        <div className="space-y-8">
          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Laboratory activity</p><h2 className="mt-1.5 text-xl font-bold text-slate-950">Test status</h2></div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{labRequests.length} request{labRequests.length === 1 ? '' : 's'}</span>
            </div>
            {labRequestsLoading ? <p className="mt-4 text-sm text-slate-500">Checking laboratory activity…</p> : labRequests.length === 0 ? <p className="mt-4 text-sm text-slate-500">No laboratory requests have been sent for this patient.</p> : (
              <div className="mt-4 divide-y divide-slate-100">
                {labRequests.map((request) => {
                  const completed = request.status === 'completed'
                  return <div key={request.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{request.test_name}</p><p className="mt-1 text-xs text-slate-500">Sent {new Date(request.requested_at).toLocaleString()}</p>{completed && request.result ? <p className="mt-2 text-sm text-slate-700"><span className="font-semibold">Result:</span> {request.result.result_value}{request.result.unit ? ` ${request.result.unit}` : ''}</p> : null}</div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${completed ? 'bg-emerald-50 text-emerald-700' : request.status === 'in_progress' ? 'bg-amber-50 text-amber-700' : 'bg-sky-50 text-sky-700'}`}>{completed ? 'Result received' : request.status === 'in_progress' ? 'In progress' : 'Sent to lab'}</span></div>
                })}
              </div>
            )}
          </section>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2 text-cyan-700"><FlaskConical className="h-4 w-4" /><p className="text-[10px] font-bold uppercase tracking-[0.2em]">Laboratory order</p></div><h2 className="mt-1.5 text-xl font-bold text-slate-950">Select investigations</h2><p className="mt-1 text-sm text-slate-500">Choose one or more tests for the laboratory queue.</p></div><span className="inline-flex w-fit items-center rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">{selectedTests.length} selected</span></div>
            <form onSubmit={requestLabTest} className="mt-4">
              <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3" aria-label="Available laboratory investigations">
                {testOptions.map((test) => { const isSelected = selectedTests.includes(test.id); return <button key={test.id} type="button" aria-pressed={isSelected} onClick={() => setSelectedTests((current) => isSelected ? current.filter((id) => id !== test.id) : [...current, test.id])} className={`group rounded-xl border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1 ${isSelected ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200 bg-white hover:border-cyan-300 hover:bg-slate-50'}`}><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-bold text-slate-900">{test.name}</p><p className="mt-1 text-[11px] leading-4 text-slate-500">{test.detail}</p></div><span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${isSelected ? 'border-cyan-600 bg-cyan-600 text-white' : 'border-slate-300 text-transparent group-hover:border-cyan-400'}`} aria-hidden="true"><Check className="h-3 w-3" /></span></div></button> })}
              </div>
              <label className="mt-4 block"><span className="text-xs font-bold uppercase tracking-wider text-slate-500">Clinical notes for laboratory</span><textarea value={clinicalNotes} onChange={(event) => setClinicalNotes(event.target.value)} rows="2" placeholder="Symptoms, context, or questions for the technician" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" /></label>
              {labStatus.text ? <p className={`mt-3 text-sm ${labStatus.type === 'error' ? 'text-rose-600' : 'text-emerald-700'}`}>{labStatus.text}</p> : null}
              <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-slate-500">The laboratory team will only see tests you submit.</p><button type="submit" disabled={labLoading || !selectedPatient || selectedTests.length === 0} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"><FlaskConical className="h-4 w-4" />{labLoading ? 'Sending…' : 'Send to laboratory'}</button></div>
            </form>
          </section>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-1 border-b border-slate-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Final documentation</p>
                <h2 className="mt-1.5 text-xl font-bold text-slate-950">Doctor assessment</h2>
                <p className="mt-1 text-sm text-slate-500">Record your decision after reviewing the patient and available evidence.</p>
              </div>
              <span className="text-xs text-slate-400">Required clinical record</span>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-6">
              <section className="space-y-4">
                <div><p className="text-xs font-bold uppercase tracking-wider text-sky-700">01 · Clinical decision</p><p className="mt-1 text-xs text-slate-500">Confirm your review and document the primary diagnosis.</p></div>
                <label className="flex items-start gap-3 rounded-xl border border-sky-100 bg-sky-50/60 p-4 text-sm text-slate-700">
                  <input type="checkbox" name="confirmed" checked={form.confirmed} onChange={handleChange} className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
                  <span>I verified the latest vitals and I am ready to document the diagnosis for this patient.</span>
                </label>
                <div className="grid gap-4 lg:grid-cols-[1fr_12rem]">
                  <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">Final diagnosis</span><input name="final_diagnosis" value={form.final_diagnosis} onChange={handleChange} placeholder="e.g. Malaria, Dehydration, Pneumonia" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100" /></label>
                  <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">Confidence</span><input name="confidence_score" type="number" min="0" max="1" step="0.01" value={form.confidence_score} onChange={handleChange} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100" /></label>
                </div>
              </section>

              <section className="space-y-4 border-t border-slate-100 pt-5">
                <div><p className="text-xs font-bold uppercase tracking-wider text-sky-700">02 · Care plan</p><p className="mt-1 text-xs text-slate-500">Capture treatment and medication instructions for the patient record.</p></div>
                <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">Treatment plan</span><input name="treatment_plan" value={form.treatment_plan} onChange={handleChange} placeholder="e.g. Oral rehydration and antimalarial therapy" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100" /></label>
                <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">Prescription</span><textarea name="prescription" value={form.prescription} onChange={handleChange} rows="3" placeholder="Medication name, dose, route, and duration" className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100" /></label>
              </section>

              <section className="space-y-4 border-t border-slate-100 pt-5">
                <div><p className="text-xs font-bold uppercase tracking-wider text-sky-700">03 · Clinical notes</p><p className="mt-1 text-xs text-slate-500">Add context for follow-up, referrals, and the patient record.</p></div>
                <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">Diagnosis notes</span><textarea name="diagnosis_notes" value={form.diagnosis_notes} onChange={handleChange} rows="4" placeholder="Add your diagnosis summary, treatment plan, and follow-up instructions..." className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100" /></label>
                <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">Referral / specialist handoff</span><textarea name="referral" value={form.referral} onChange={handleChange} rows="3" placeholder="Referral note or specialist escalation" className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100" /></label>
              </section>

              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      name="patient_consent"
                      checked={form.patient_consent}
                      onChange={handleChange}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span>The patient consented to this clinical review and treatment plan.</span>
                  </label>

                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      name="doctor_override"
                      checked={form.doctor_override}
                      onChange={handleChange}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span>I am overriding or confirming the AI recommendation as the treating doctor.</span>
                  </label>
              </div>

              {error ? (
                  <div className="rounded-[1.75rem] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                  </div>
              ) : null}

              <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <Button type="submit" disabled={loading || !selectedPatient || !latestVital}>
                    {loading ? 'Saving diagnosis…' : 'Save diagnosis'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setForm(initialForm)
                      setError('')
                    }}
                  >
                    Reset form
                  </Button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}
