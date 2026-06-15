import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPatients } from '../../services/patientService'

export default function Patients() {
  const [patients, setPatients] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    void getPatients().then(({ data, error }) => {
      if (error) {
        console.error(error)
        return
      }
      setPatients(data)
    })
  }, [])

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return patients
    return patients.filter((patient) => {
      return (
        patient.full_name.toLowerCase().includes(query) ||
        patient.phone.toLowerCase().includes(query) ||
        patient.gender.toLowerCase().includes(query) ||
        patient.email?.toLowerCase().includes(query) ||
        patient.blood_group?.toLowerCase().includes(query)
      )
    })
  }, [patients, search])

  const initials = (name) => {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Patients</h2>
          <p className="mt-1 text-sm text-slate-500">Review patient records, update details, and manage your roster all in one place.</p>
        </div>

        <Link
          to="/dashboard/patients/add"
          className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
        >
          Add Patient
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_15px_60px_-24px_rgba(15,23,42,0.22)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Total patients</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{patients.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_15px_60px_-24px_rgba(15,23,42,0.22)]">
          <label className="block text-sm font-medium text-slate-700">Search patients</label>
          <div className="mt-3 relative">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">🔍</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, phone, gender, blood group"
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-[0_15px_60px_-24px_rgba(15,23,42,0.22)]">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Patient</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Gender</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Blood Group</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredPatients.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-10 text-center text-sm text-slate-500">
                  No patients found. Try a different search term or add a new patient.
                </td>
              </tr>
            ) : (
              filteredPatients.map((patient) => (
                <tr key={patient.id} className="transition hover:bg-slate-50">
                  <td className="px-4 py-4 text-sm text-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-700">
                        {initials(patient.full_name)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{patient.full_name}</p>
                        <p className="text-sm text-slate-500">{patient.email || 'No email provided'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">{patient.phone || '-'}</td>
                  <td className="px-4 py-4 text-sm text-slate-700">{patient.gender || '-'}</td>
                  <td className="px-4 py-4 text-sm text-slate-700">
                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-slate-600">
                      {patient.blood_group || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <Link
                      to={`/dashboard/patients/${patient.id}`}
                      className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
