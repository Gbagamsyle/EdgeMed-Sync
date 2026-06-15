import { useState } from 'react'
import { createPatient } from '../../services/patientService'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'

export default function AddPatient() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    other_names: '',
    email: '',
    nin: '',
    phone: '',
    gender: '',
    blood_group: '',
    address: '',
    pin: ''
  })
  const [status, setStatus] = useState({ type: '', message: '' })
  const [qrCode, setQrCode] = useState(null)
  const [did, setDid] = useState(null)

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus({ type: 'loading', message: 'Saving patient details...' })

    const joinedName = [form.first_name, form.other_names, form.last_name]
      .filter(Boolean)
      .join(' ')

    const payload = {
      ...form,
      full_name: joinedName,
    }

    if (form.nin && form.nin.length > 10) {
      setStatus({ type: 'error', message: 'NIN must be at most 10 digits long.' })
      return
    }

    if (!form.pin || !/^\d{4}$/.test(form.pin)) {
      setStatus({ type: 'error', message: 'Please enter a 4-digit patient PIN for QR recovery.' })
      return
    }

    const { data, error } = await createPatient(payload)

    if (error) {
      setStatus({ type: 'error', message: error.message })
      return
    }

    const identityResponse = await fetch(`${BACKEND_URL}/api/identity/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient_id: data.id, pin: form.pin })
    })

    const identityData = await identityResponse.json()
    if (!identityResponse.ok) {
      setStatus({ type: 'error', message: identityData.error || 'Failed to generate patient QR code.' })
      return
    }

    setStatus({ type: 'success', message: 'Patient added and QR generated successfully.' })
    setQrCode(identityData.qrCode)
    setDid(identityData.did)
    console.log('New patient', data)
    setForm({ first_name: '', last_name: '', other_names: '', email: '', nin: '', phone: '', gender: '', blood_group: '', address: '', pin: '' })
  }

  return (
      <form onSubmit={handleSubmit} className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 space-y-6 shadow-xl shadow-slate-200/50">
        {status.message ? (
          <div
            className={`rounded-3xl border px-4 py-3 text-sm font-medium ${
              status.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : status.type === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-slate-200 bg-slate-50 text-slate-700'
            }`}
            role="status"
            aria-live="polite"
          >
            {status.message}
          </div>
        ) : null}

        <Card title="Patient information">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">First Name</span>
              <Input name="first_name" value={form.first_name} onChange={handleChange} placeholder="John" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Last Name</span>
              <Input name="last_name" value={form.last_name} onChange={handleChange} placeholder="Doe" />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Other Names</span>
              <Input name="other_names" value={form.other_names} onChange={handleChange} placeholder="Middle name or additional names" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <Input name="email" value={form.email} onChange={handleChange} placeholder="john.doe@example.com" type="email" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">NIN</span>
              <Input
                name="nin"
                value={form.nin}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/\D/g, '').slice(0, 10)
                  setForm({ ...form, nin: numericValue })
                }}
                placeholder="1234567890"
                inputMode="numeric"
                maxLength={10}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Phone</span>
              <Input name="phone" value={form.phone} onChange={handleChange} placeholder="08012345678" />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">4-Digit PIN</span>
              <Input
                name="pin"
                value={form.pin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                  setForm({ ...form, pin: value })
                }}
                placeholder="1234"
                maxLength={4}
                inputMode="numeric"
              />
              <p className="text-xs text-slate-500">Used to recover QR/identity if lost.</p>
            </label>
          </div>
        </Card>

        <Card title="Medical details">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Gender</span>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition duration-150 focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Blood Group</span>
              <select
                name="blood_group"
                value={form.blood_group}
                onChange={handleChange}
                className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition duration-150 focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              >
                <option value="">Select blood group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Address</span>
              <Input name="address" value={form.address} onChange={handleChange} placeholder="Residential address" />
            </label>
          </div>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">Required fields are highlighted with labels. Save to create the patient record.</p>
          <div className="w-full sm:ml-auto sm:w-[180px]">
            <Button type="submit" disabled={status.type === 'loading'}>
              {status.type === 'loading' ? 'Saving...' : 'Save Patient'}
            </Button>
          </div>
        </div>

        {qrCode ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 mt-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Patient QR Code</h2>
            <div className="flex flex-col items-center gap-4">
              <img src={qrCode} alt="Patient QR code" className="w-56 h-56 rounded-3xl border border-slate-200" />
              <p className="text-sm text-slate-600 break-all">DID: {did}</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = qrCode
                    link.download = `patient-${did}.png`
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                  }}
                >
                  Download QR
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const printWindow = window.open('', '', 'width=600,height=600')
                    if (!printWindow) return
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Print Patient QR</title>
                        </head>
                        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;margin:0;padding:20px;">
                          <h1 style="font-family:sans-serif;">Patient QR</h1>
                          <img src="${qrCode}" style="max-width:100%;height:auto;margin-top:20px;" />
                          <p style="font-family:sans-serif;margin-top:10px;word-break:break-all;">DID: ${did}</p>
                        </body>
                      </html>
                    `)
                    printWindow.document.close()
                    printWindow.focus()
                    setTimeout(() => {
                      printWindow.print()
                      printWindow.close()
                    }, 500)
                  }}
                >
                  Print QR
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </form>
  )
}
