import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPatientVitals } from '../../services/vitalsService'

export default function PatientRecords() {
  const { id } = useParams()
  const [vitals, setVitals] = useState([])
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

      setLoading(false)
    }

    fetchVitals()

    return () => {
      isMounted = false
    }
  }, [id])

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
    </div>
  )
}
