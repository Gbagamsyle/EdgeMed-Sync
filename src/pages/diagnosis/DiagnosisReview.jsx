import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { diagnosisService } from '../../services/diagnosisService'
import { getPatientById } from '../../services/patientService'
import { getPatientVitals, getVitalStatus } from '../../services/vitalsService'

const initialForm = {
  diagnosis_notes: '',
  confirmed: false,
}

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
  const [serviceMessage, setServiceMessage] = useState('Checking AI service…')

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
        setServiceMessage(
          status?.status === 'online'
            ? 'AI inference service is online.'
            : status?.error || 'AI inference service is currently unavailable.'
        )
      } catch (err) {
        if (!isMounted) return
        setServiceStatus('offline')
        setServiceMessage(err.message || 'AI inference service is currently unavailable.')
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

    if (!form.confirmed) {
      setError('Please confirm that you reviewed the latest vitals.')
      return
    }

    setLoading(true)

    try {
      const normalizedVitals = normalizeVitals(latestVital)
      await diagnosisService.saveDiagnosis({
        patient_did: selectedPatient.id,
        doctor_id: user?.id || profile?.id,
        vitals: normalizedVitals,
        diagnosis_notes: form.diagnosis_notes,
        recorded_by: user?.id || profile?.id,
      })
    } catch (err) {
      setError(err.message || 'Unable to save diagnosis record.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeColor = (status) => {
    const colors = {
      normal: 'bg-emerald-100 text-emerald-700',
      warning: 'bg-amber-100 text-amber-700',
      critical: 'bg-rose-100 text-rose-700',
      unknown: 'bg-slate-100 text-slate-700',
    }
    return colors[status] || colors.unknown
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card title="Diagnosis review">
            {selectedPatient ? (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Patient</p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">{selectedPatient.full_name}</h2>
                    <p className="mt-2 text-sm text-slate-600">Gender: {selectedPatient.gender || 'N/A'} · Blood group: {selectedPatient.blood_group || 'N/A'}</p>
                  </div>
                  <div className="flex flex-col items-start gap-3 sm:items-end">
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ${serviceStatus === 'online' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      <span className={`h-2.5 w-2.5 rounded-full ${serviceStatus === 'online' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {serviceStatus === 'online' ? 'AI online' : 'AI offline'}
                    </span>
                    <button
                      type="button"
                      onClick={runPrediction}
                      disabled={predictionLoading || !latestVital}
                      className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {predictionLoading ? 'Analyzing…' : 'View AI prediction'}
                    </button>
                  </div>
                </div>

                {predictionError ? (
                  <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {predictionError}
                  </div>
                ) : null}

                {predictionResult ? (
                  <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Prediction result</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">
                      {predictionResult.label || predictionResult.prediction || predictionResult.result || 'No prediction'}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Confidence: {typeof predictionResult.confidence === 'number' ? `${Math.round(predictionResult.confidence * 100)}%` : 'N/A'}
                    </p>
                    {predictionResult.reasoning ? (
                      <p className="mt-3 text-sm leading-6 text-slate-600">{predictionResult.reasoning}</p>
                    ) : null}
                  </div>
                ) : null}

                <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Vitals</p>
                      <p className="text-sm font-semibold text-slate-900">Latest snapshot</p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                      {latestVital ? 'Updated' : 'Pending'}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[
                      ['Temp', `${latestVital?.temperature_celsius ?? '—'}°C`],
                      ['HR', `${latestVital?.heart_rate ?? '—'} bpm`],
                      ['BP', latestVital?.systolic_bp && latestVital?.diastolic_bp ? `${latestVital.systolic_bp}/${latestVital.diastolic_bp}` : '—'],
                      ['SpO₂', `${latestVital?.oxygen_saturation ?? '—'}%`],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-[1.25rem] border border-slate-200 bg-white p-3 shadow-sm">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">{label}</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-[1.25rem] border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-sm">
                    <span className="font-semibold text-slate-900">Last recorded:</span>{' '}
                    {latestVital ? new Date(latestVital.created_at).toLocaleString() : 'No vitals yet'}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Loading patient information…</p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Doctor assessment">
            <div className="space-y-4">
              <p className="text-sm text-slate-600">Confirm the latest vitals and document your clinical findings below.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="flex items-start gap-3 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name="confirmed"
                    checked={form.confirmed}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span>I verified the latest vitals and I am ready to document the diagnosis for this patient.</span>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Diagnosis notes</span>
                  <textarea
                    name="diagnosis_notes"
                    value={form.diagnosis_notes}
                    onChange={handleChange}
                    rows="6"
                    placeholder="Add your diagnosis summary, treatment plan, and follow-up instructions..."
                    className="w-full rounded-[1.75rem] border border-slate-300 px-4 py-4 text-sm text-slate-900 outline-none transition duration-150 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </label>

                {error ? (
                  <div className="rounded-[1.75rem] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
