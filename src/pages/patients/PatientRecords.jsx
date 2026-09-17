import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getPatientVitals } from '../../services/vitalsService'
import { getPatientLabResults } from '../../services/labService'

export default function PatientRecords() {
  const { id } = useParams()
  const { profile } = useAuth()
  const [vitals, setVitals] = useState([])
  const [labResults, setLabResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const fetchVitals = async () => {
      if (!id) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const { data, error: vitalsError } = await getPatientVitals(id)

      if (!isMounted) return

      if (vitalsError) {
        setError(vitalsError.message || 'Unable to load vitals history.')
        setVitals([])
      } else {
        setVitals(data || [])
      }

      if (profile?.role === 'doctor') {
        try {
          const payload = await getPatientLabResults(id)
          setLabResults(payload.results || [])
        } catch (labError) {
          setError(labError.message || 'Unable to load laboratory results.')
        }
      }

      setLoading(false)
    }

    fetchVitals()

    return () => {
      isMounted = false
    }
  }, [id, profile?.role])

  const formatDate = (value) => {
    if (!value) return '—'

    return new Date(value).toLocaleString()
  }

  const formatValue = (value) => {
    if (value === null || value === undefined || value === '') return '—'
    return value
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Patient Records for {id}</h1>
        <p className="text-gray-600">Vitals history for this patient is pulled from Supabase.</p>
      </div>

      {loading ? (
        <p className="text-gray-600">Loading vitals history…</p>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
      ) : vitals.length === 0 ? (
        <p className="text-gray-600">No vitals recorded yet for this patient.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Recorded At</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Temp (°C)</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">BP</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Heart Rate</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Resp. Rate</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">SpO₂</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Weight</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">BMI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {vitals.map((vital) => (
                <tr key={vital.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{formatDate(vital.created_at)}</td>
                  <td className="px-4 py-3 text-gray-700">{formatValue(vital.temperature_celsius)}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {formatValue(vital.systolic_bp)} / {formatValue(vital.diastolic_bp)}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{formatValue(vital.heart_rate)}</td>
                  <td className="px-4 py-3 text-gray-700">{formatValue(vital.respiratory_rate)}</td>
                  <td className="px-4 py-3 text-gray-700">{formatValue(vital.oxygen_saturation)}</td>
                  <td className="px-4 py-3 text-gray-700">{formatValue(vital.weight_kg)}</td>
                  <td className="px-4 py-3 text-gray-700">{formatValue(vital.bmi)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {profile?.role === 'doctor' ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">Laboratory results</h2>
          {labResults.length === 0 ? <p className="text-sm text-slate-600">No completed laboratory results are attached to this patient.</p> : (
            <div className="grid gap-4 md:grid-cols-2">
              {labResults.map((result) => (
                <article key={result.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div><h3 className="font-semibold text-slate-900">{result.test_name}</h3><p className="text-xs text-slate-500">{new Date(result.created_at).toLocaleString()}</p></div>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold uppercase text-slate-700">{result.status}</span>
                  </div>
                  <p className="mt-4 text-lg font-semibold text-slate-900">{result.result_value} {result.unit || ''}</p>
                  {result.reference_range ? <p className="mt-1 text-sm text-slate-500">Reference: {result.reference_range}</p> : null}
                  {result.notes ? <p className="mt-3 text-sm text-slate-600">{result.notes}</p> : null}
                  <p className="mt-4 text-xs text-slate-500">Performed by {result.technician?.full_name || 'laboratory technician'}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  )
}
