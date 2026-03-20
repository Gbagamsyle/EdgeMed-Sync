import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPatients } from '../../services/patientService'

export default function Patients() {
  const [patients, setPatients] = useState([])

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    const { data, error } = await getPatients()
    if (error) {
      console.error(error)
      return
    }
    setPatients(data)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Patients</h2>
        <Link to="/dashboard/patients/add" className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-600">Add Patient</Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Name</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Phone</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Gender</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {patients.map((p) => (
              <tr key={p.id}>
                <td className="px-3 py-3 text-sm text-slate-700">{p.full_name}</td>
                <td className="px-3 py-3 text-sm text-slate-700">{p.phone}</td>
                <td className="px-3 py-3 text-sm text-slate-700">{p.gender}</td>
                <td className="px-3 py-3 text-sm">
                  <Link to={`/dashboard/patients/${p.id}`} className="text-sky-600 hover:text-sky-800">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
