import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getPatientById } from '../../services/patientService'
import Card from '../../components/ui/Card'

export default function PatientProfile() {
  const { id } = useParams()
  const [patient, setPatient] = useState(null)

  useEffect(() => {
    void getPatientById(id).then(({ data, error }) => {
      if (error) {
        console.error(error)
        return
      }
      setPatient(data)
    })
  }, [id])

  const printQR = () => {
    if (!patient?.qr_code) return
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<!doctype html><html><head><title>Print QR</title></head><body style="display:flex;align-items:center;justify-content:center;margin:0;padding:20px;"><img src="${patient.qr_code}" style="max-width:100%;height:auto;"/></body></html>`)
    w.document.close()
    w.focus()
    // wait for image to load then print
    setTimeout(() => { w.print(); w.close() }, 500)
  }

  if (!patient) return <p>Loading...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/dashboard/patients" className="text-sm text-slate-500 hover:underline">← Back to patients</Link>
        <div className="flex items-center gap-3">
          <Link
            to={`/dashboard/vitals`}
            state={{ selectedPatientId: patient.id }}
            className="rounded-2xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            View Vitals
          </Link>
          
          <Link
            to={`/dashboard/patients/${patient.id}/edit`}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:shadow"
          >
            Edit
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card title="Patient details">
            <div className="grid gap-3">
              <div>
                <p className="text-lg font-semibold text-slate-900">{patient.full_name}</p>
                {patient.email && <p className="text-sm text-slate-600">{patient.email}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-slate-700">
                <div>
                  <p className="text-slate-500">Phone</p>
                  <p className="font-medium">{patient.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Gender</p>
                  <p className="font-medium">{patient.gender || '-'}</p>
                </div>
                {/* Date of birth removed - not collected */}
                <div>
                  <p className="text-slate-500">NIN</p>
                  <p className="font-medium">{patient.nin || '-'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-slate-500">Blood group</p>
                  <p className="font-medium">{patient.blood_group || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-slate-500">Address</p>
                  <p className="font-medium">{patient.address || '-'}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card title="Patient QR">
            <div className="flex flex-col items-center gap-4">
              {patient.qr_code ? (
                <img src={patient.qr_code} alt="Patient QR" className="w-40 h-40 rounded-md" />
              ) : (
                <div className="flex h-40 w-40 items-center justify-center rounded-md bg-slate-50 text-sm text-slate-500">No QR</div>
              )}

              <div className="w-full">
                <button
                  onClick={printQR}
                  className="w-full rounded-2xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-200"
                >
                  Print QR
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
