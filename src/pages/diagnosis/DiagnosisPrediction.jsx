import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { getPatientById } from '../../services/patientService'
import { getPatientVitals } from '../../services/vitalsService'
import { diagnosisService } from '../../services/diagnosisService'

const normalizeVitals = (vital) => ({
  heart_rate: vital?.heart_rate ?? 0,
  systolic_bp: vital?.systolic_bp ?? 0,
  diastolic_bp: vital?.diastolic_bp ?? 0,
  spo2: vital?.oxygen_saturation ?? 0,
  temperature: vital?.temperature_celsius ?? 0,
  resp_rate: vital?.respiratory_rate ?? 0,
})

export default function DiagnosisPrediction() {
  const { patientId } = useParams()
  const [patient, setPatient] = useState(null)
  const [latestVital, setLatestVital] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadPatient = async () => {
      if (!patientId) return
      const { data, error } = await getPatientById(patientId)
      if (!error) setPatient(data)
    }

    void loadPatient()
  }, [patientId])

  useEffect(() => {
    const loadVital = async () => {
      if (!patientId) return
      const { data, error } = await getPatientVitals(patientId, 1)
      if (!error && data?.length) setLatestVital(data[0])
    }

    void loadVital()
  }, [patientId])

  const runAnalysis = async () => {
    if (!latestVital) {
      setError('No vitals available for prediction.')
      return
    }

    setLoading(true)
    setError('')
    setAnalysis(null)

    try {
      const normalized = normalizeVitals(latestVital)
      const response = await diagnosisService.analyze(normalized)
      setAnalysis(response)
    } catch (err) {
      setError(err.message || 'Prediction failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-8 shadow-[0_35px_80px_-24px_rgba(15,23,42,0.16)]">
        <h1 className="text-3xl font-bold text-slate-900">AI Prediction</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Run the AI prediction for the selected patient using their latest recorded vitals.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card title="Patient summary">
          {patient ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">Patient</p>
              <p className="text-xl font-semibold text-slate-900">{patient.full_name}</p>
              <p className="text-sm text-slate-600">Gender: {patient.gender || 'N/A'}</p>
              <p className="text-sm text-slate-600">Blood group: {patient.blood_group || 'N/A'}</p>
              <Link
                to={`/dashboard/diagnosis/${patientId}`}
                className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Back to review
              </Link>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Loading patient information…</p>
          )}
        </Card>

        <Card title="Latest vitals">
          {latestVital ? (
            <div className="space-y-3 text-sm text-slate-700">
              <p><span className="font-semibold">Recorded:</span> {new Date(latestVital.created_at).toLocaleString()}</p>
              <p><span className="font-semibold">Temperature:</span> {latestVital.temperature_celsius ?? '—'}°C</p>
              <p><span className="font-semibold">Heart rate:</span> {latestVital.heart_rate ?? '—'} bpm</p>
              <p><span className="font-semibold">Blood pressure:</span> {latestVital.systolic_bp && latestVital.diastolic_bp ? `${latestVital.systolic_bp}/${latestVital.diastolic_bp}` : '—'}</p>
              <p><span className="font-semibold">Respiratory rate:</span> {latestVital.respiratory_rate ?? '—'} /min</p>
              <p><span className="font-semibold">Oxygen saturation:</span> {latestVital.oxygen_saturation ?? '—'}%</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No latest vitals found for this patient.</p>
          )}
        </Card>
      </div>

      <div className="space-y-4">
        <Button type="button" onClick={runAnalysis} disabled={loading || !latestVital}>
          {loading ? 'Predicting…' : 'Run AI prediction'}
        </Button>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : null}

        {analysis ? (
          <Card title="Prediction result">
            <div className="space-y-3">
              <p className="text-sm text-slate-500">Suggested condition</p>
              <p className="text-2xl font-bold text-slate-900">{analysis.label || 'No prediction'}</p>
              <p className="text-sm text-slate-600">Confidence: {typeof analysis.confidence === 'number' ? `${Math.round(analysis.confidence * 100)}%` : 'N/A'}</p>
              {analysis.severity ? <p className="text-sm font-medium text-slate-700">Severity: {analysis.severity}</p> : null}
              {analysis.description ? <p className="text-sm text-slate-600">{analysis.description}</p> : null}
              {Array.isArray(analysis.guidance) && analysis.guidance.length > 0 ? (
                <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">AI guidance</p>
                  <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
                    {analysis.guidance.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
