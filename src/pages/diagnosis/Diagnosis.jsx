import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPatients } from '../../services/patientService'
import { getPatientVitals } from '../../services/vitalsService'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'

const formatVital = (value, suffix = '') => (value !== null && value !== undefined ? `${value}${suffix}` : '-')

const getInitials = (name) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

export default function Diagnosis() {
  const [patients, setPatients] = useState([])
  const [search, setSearch] = useState('')
  const [latestVitals, setLatestVitals] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadPatients = async () => {
      setLoading(true)
      const { data, error } = await getPatients()
      if (!error) {
        setPatients(data || [])
      }
      setLoading(false)
    }

    void loadPatients()
  }, [])

  useEffect(() => {
    const loadLatestVitals = async () => {
      const entries = await Promise.all(
        patients.slice(0, 30).map(async (patient) => {
          const { data, error } = await getPatientVitals(patient.id, 1)
          return [patient.id, !error && data?.[0] ? data[0] : null]
        })
      )
      setLatestVitals(Object.fromEntries(entries))
    }

    if (patients.length > 0) {
      void loadLatestVitals()
    }
  }, [patients])

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return patients

    return patients.filter((patient) =>
      [patient.full_name, patient.phone, patient.gender, patient.email, patient.blood_group]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    )
  }, [patients, search])

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-8 shadow-[0_35px_80px_-24px_rgba(15,23,42,0.16)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Diagnosis</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Patient vitals dashboard</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Search patients and review their recorded vitals in a table. Click a patient to see the full vital history and continue to AI prediction.
            </p>
          </div>
        </div>
      </div>

      <Card title="Search patients">
        <div className="relative rounded-[2rem] border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search patients by name, phone, gender, or blood group"
            className="w-full border-none bg-transparent pl-12 pr-28 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-0"
          />
          {search ? (
            <button
              onClick={() => setSearch('')}
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-300"
            >
              Clear
            </button>
          ) : null}
        </div>
      </Card>

      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-[0.15em]">Patient</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-[0.15em]">Temperature</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-[0.15em]">BP</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-[0.15em]">HR</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-[0.15em]">O₂ sat</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-[0.15em]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-sm text-slate-500">Loading patients…</td>
              </tr>
            ) : filteredPatients.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-sm text-slate-500">No patients found. Try a different search.</td>
              </tr>
            ) : (
              filteredPatients.map((patient) => {
                const vitals = latestVitals[patient.id]
                return (
                  <tr key={patient.id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-700">
                          {getInitials(patient.full_name)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{patient.full_name}</p>
                          <p className="text-sm text-slate-500">{patient.phone || 'No phone'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-700">{formatVital(vitals?.temperature_celsius, '°C')}</td>
                    <td className="px-4 py-4 text-slate-700">
                      {vitals?.systolic_bp && vitals?.diastolic_bp ? `${vitals.systolic_bp}/${vitals.diastolic_bp}` : '-'}
                    </td>
                    <td className="px-4 py-4 text-slate-700">{formatVital(vitals?.heart_rate, ' bpm')}</td>
                    <td className="px-4 py-4 text-slate-700">{formatVital(vitals?.oxygen_saturation, '%')}</td>
                    <td className="px-4 py-4">
                      <Link
                        to={`/dashboard/diagnosis/${patient.id}`}
                        className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-sky-700 transition hover:bg-sky-100"
                      >
                        View full vitals
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
