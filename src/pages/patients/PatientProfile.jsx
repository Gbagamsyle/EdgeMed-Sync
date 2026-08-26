import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useParams, Link } from 'react-router-dom'
import { getPatientById } from '../../services/patientService'
import { BACKEND_URL } from '../../services/config'
import Card from '../../components/ui/Card'

export default function PatientProfile() {
  const { profile } = useAuth()
  const { id } = useParams()
  const [patient, setPatient] = useState(null)
  const [identityPin, setIdentityPin] = useState('')
  const [identityStatus, setIdentityStatus] = useState({ type: '', message: '' })
  const [registeringIdentity, setRegisteringIdentity] = useState(false)

  useEffect(() => {
    void getPatientById(id).then(({ data, error }) => {
      if (error) {
        console.error(error)
        return
      }
      setPatient(data)
    })
  }, [id])

  const registerIdentity = async (event) => {
    event.preventDefault()

    if (!/^\d{4}$/.test(identityPin)) {
      setIdentityStatus({ type: 'error', message: 'Enter a 4-digit PIN.' })
      return
    }

    setRegisteringIdentity(true)
    setIdentityStatus({ type: '', message: '' })

    try {
      const response = await fetch(`${BACKEND_URL}/api/identity/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: patient.id, pin: identityPin }),
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to register patient identity.')
      }

      setPatient((current) => ({ ...current, did: payload.did, qr_code: payload.qrCode }))
      setIdentityPin('')
      setIdentityStatus({ type: 'success', message: 'Identity registered. You can now save diagnoses for this patient.' })
    } catch (error) {
      setIdentityStatus({ type: 'error', message: error.message || 'Unable to register patient identity.' })
    } finally {
      setRegisteringIdentity(false)
    }
  }

  const printQR = () => {
    if (!patient?.qr_code) return
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<!doctype html><html><head><title>Print QR</title></head><body style="display:flex;align-items:center;justify-content:center;margin:0;padding:20px;"><img src="${patient.qr_code}" style="max-width:100%;height:auto;"/></body></html>`)
    w.document.close()
    w.focus()
    // wait for image to load then print
    setTimeout(() => { w.print(); w.close() }, 500)

    // Send audit log for QR print
    try {
      const staffId = profile?.id || null
      const staffName = profile?.full_name || profile?.name || null
      fetch(`${BACKEND_URL}/api/audit/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'qr_print',
          patient_id: patient.id,
          patient_did: patient.did,
          staff_id: staffId,
          staff_name: staffName,
          details: { via: 'PatientProfile UI' }
        })
      }).catch(err => console.warn('Audit log failed:', err))
    } catch (err) {
      console.warn('Audit log exception:', err)
    }
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
                {patient.did ? (
                  <button
                    onClick={printQR}
                    className="w-full rounded-2xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  >
                    Print QR
                  </button>
                ) : (
                  <form onSubmit={registerIdentity} className="space-y-3">
                    <p className="text-sm text-slate-600">Register an identity before creating diagnosis records.</p>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={identityPin}
                      onChange={(event) => setIdentityPin(event.target.value.replace(/\D/g, ''))}
                      placeholder="4-digit PIN"
                      aria-label="Patient identity PIN"
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    />
                    <button
                      type="submit"
                      disabled={registeringIdentity}
                      className="w-full rounded-2xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {registeringIdentity ? 'Registering…' : 'Register identity'}
                    </button>
                    {identityStatus.message ? (
                      <p className={`text-sm ${identityStatus.type === 'error' ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {identityStatus.message}
                      </p>
                    ) : null}
                  </form>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
