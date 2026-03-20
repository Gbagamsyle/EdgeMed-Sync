import { useState } from 'react'
import { createPatient } from '../../services/patientService'

export default function AddPatient() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    other_names: '',
    nin: '',
    phone: '',
    gender: '',
    address: ''
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const joinedName = [form.first_name, form.other_names, form.last_name]
      .filter(Boolean)
      .join(' ')

    const payload = {
      ...form,
      full_name: joinedName,
    }

    if (form.nin && form.nin.length > 10) {
      alert('NIN must be at most 10 digits long.')
      return
    }

    const { data, error } = await createPatient(payload)

    if (error) {
      alert(error.message)
      return
    }

    alert('Patient added successfully!')
    console.log('New patient', data)
    setForm({ first_name: '', last_name: '', other_names: '', nin: '', phone: '', gender: '', address: '' })
  }

  return (
    <div className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-slate-700 heading-dark">Add Patient</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={form.first_name} name="first_name" placeholder="First Name" onChange={handleChange} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            <input value={form.last_name} name="last_name" placeholder="Last Name" onChange={handleChange} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <input value={form.other_names} name="other_names" placeholder="Other Names (optional)" onChange={handleChange} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          <input
            value={form.nin}
            name="nin"
            placeholder="NIN (National ID Number)"
            onChange={(e) => {
              const numericValue = e.target.value.replace(/\D/g, '').slice(0, 10)
              setForm({ ...form, nin: numericValue })
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            inputMode="numeric"
            maxLength={10}
          />
          <input value={form.phone} name="phone" placeholder="Phone" onChange={handleChange} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
          >
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          <input value={form.address} name="address" placeholder="Address" onChange={handleChange} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          <button type="submit" className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700">Save Patient</button>
        </form>
      </div>
  )
}
