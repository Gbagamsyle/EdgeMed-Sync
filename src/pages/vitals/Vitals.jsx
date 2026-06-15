import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getPatientById } from '../../services/patientService'
import { useAuth } from '../../context/AuthContext'
import { getPatients } from '../../services/patientService'
import { createVital, getPatientVitals, getVitalStatus } from '../../services/vitalsService'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Card from '../../components/ui/Card'

export default function Vitals() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [patients, setPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [vitalHistory, setVitalHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [searchInput, setSearchInput] = useState('')

  const [form, setForm] = useState({
    temperature_celsius: '',
    systolic_bp: '',
    diastolic_bp: '',
    heart_rate: '',
    respiratory_rate: '',
    oxygen_saturation: '',
    weight_kg: '',
    height_cm: '',
    notes: ''
  })

  // Load patients on mount
  useEffect(() => {
    const loadPatients = async () => {
      const { data, error } = await getPatients()
      if (!error) {
        setPatients(data || [])
      }
    }
    loadPatients()
  }, [])

  // If navigated with a selectedPatientId in state, load that patient
  useEffect(() => {
    const id = location?.state?.selectedPatientId
    if (!id) return

    let mounted = true
    const load = async () => {
      const { data, error } = await getPatientById(id)
      if (!error && data && mounted) {
        setSelectedPatient(data)
        setSearchInput('')
        // clear location state so re-navigation doesn't re-trigger
        navigate(location.pathname, { replace: true })
      }
    }
    void load()
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.state?.selectedPatientId])

  // Load vital history when patient is selected
  const loadVitalHistory = useCallback(async () => {
    if (!selectedPatient) return
    const { data, error } = await getPatientVitals(selectedPatient.id, 20)
    if (!error) {
      setVitalHistory(data || [])
    }
  }, [selectedPatient])

  useEffect(() => {
    if (!selectedPatient) return

    let mounted = true
    const run = async () => {
      const { data, error } = await getPatientVitals(selectedPatient.id, 20)
      if (!error && mounted) setVitalHistory(data || [])
    }

    run()
    return () => {
      mounted = false
    }
  }, [selectedPatient])

  // Filter patients based on search
  const filteredPatients = patients.filter((p) =>
    `${p.full_name} ${p.phone} ${p.nin}`.toLowerCase().includes(searchInput.toLowerCase())
  )

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient)
    setSearchInput('')
    setStatus({ type: '', message: '' })
  }

  const getInitials = (name) => {
    if (!name) return ''
    return name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value === '' ? '' : parseFloat(value) || value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedPatient) {
      setStatus({ type: 'error', message: 'Please select a patient' })
      return
    }

    // Validate at least one vital is recorded
    const hasData = Object.values(form).some((v) => v !== '' && v !== 0)
    if (!hasData) {
      setStatus({ type: 'error', message: 'Please enter at least one vital sign' })
      return
    }

    setLoading(true)
    const payload = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? null : v]))

    const { error } = await createVital(selectedPatient.id, payload, user.id)

    setLoading(false)

    if (error) {
      setStatus({ type: 'error', message: error.message })
      return
    }

    setStatus({ type: 'success', message: 'Vital signs recorded successfully!' })
    setForm({
      temperature_celsius: '',
      systolic_bp: '',
      diastolic_bp: '',
      heart_rate: '',
      respiratory_rate: '',
      oxygen_saturation: '',
      weight_kg: '',
      height_cm: '',
      notes: ''
    })

    // Reload vital history
    setTimeout(loadVitalHistory, 500)
  }

  const getStatusBadgeColor = (status) => {
    const colors = {
      normal: 'bg-emerald-100 text-emerald-700',
      warning: 'bg-amber-100 text-amber-700',
      critical: 'bg-rose-100 text-rose-700',
      unknown: 'bg-slate-100 text-slate-700'
    }
    return colors[status] || colors.unknown
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-1">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-white/30 p-3 shadow-sm hidden sm:block">
            <span className="material-symbols-outlined text-sky-600">monitor_heart</span>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Vitals Intake</h2>
            <p className="text-sm text-slate-500">Efficient patient vital capture and history</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700">Quick Record</button>
          <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">Export</button>
        </div>
      </div>

      <div className="space-y-6 lg:flex lg:items-start lg:gap-6">
        {/* Mobile patient selector (above form) */}
        <div className="lg:hidden">
          <Card title="Select Patient">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Search patient</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined pointer-events-none">search</span>
                    <Input
                      type="text"
                      placeholder="Name, phone, or NIN"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="pl-10 pr-10 text-sm"
                    />
                    {searchInput && (
                      <button
                        type="button"
                        onClick={() => setSearchInput('')}
                        aria-label="Clear search"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    )}
                  </div>
                  {searchInput && (
                    <div className="text-xs text-slate-500 mt-1">Showing {Math.min(filteredPatients.length, 10)} of {filteredPatients.length} matches</div>
                  )}
              </div>

              {searchInput && filteredPatients.length > 0 && (
                  <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-2xl mt-2">
                    {filteredPatients.length > 0 ? (
                      filteredPatients.slice(0, 10).map((patient) => (
                        <button
                          key={patient.id}
                          type="button"
                          onClick={() => handlePatientSelect(patient)}
                          className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition border-b border-slate-200 last:border-b-0 ${
                            selectedPatient?.id === patient.id
                              ? 'bg-sky-100 text-sky-900 font-medium'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex-none">
                            <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-sm font-semibold">
                              {getInitials(patient.full_name)}
                            </div>
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-medium">{patient.full_name}</div>
                            <div className="text-xs text-slate-500">{patient.phone}</div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-sm text-slate-500">No patients found matching "{searchInput}"</div>
                    )}
                  </div>
                )}

              {selectedPatient && (
                  <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3">
                    <div className="text-xs font-medium text-slate-700 mb-1">Selected Patient</div>
                    <div className="font-semibold text-sky-900">{selectedPatient.full_name}</div>
                    <div className="text-xs text-sky-700 mt-1">Gender: {selectedPatient.gender}</div>
                    <div className="text-xs text-sky-700">Blood Group: {selectedPatient.blood_group || 'N/A'}</div>
                    <button
                      onClick={() => {
                        setSelectedPatient(null)
                        setSearchInput('')
                      }}
                      className="mt-2 text-xs font-medium text-sky-600 hover:text-sky-700 underline"
                    >
                      Change patient
                    </button>
                  </div>
                )}
            </div>
          </Card>
        </div>

        {/* Desktop sticky selector */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-28">
            <Card title="Select Patient">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Search patient</label>
                  <Input
                    type="text"
                    placeholder="Name, phone, or NIN"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="text-sm"
                  />
                </div>

                {searchInput && filteredPatients.length > 0 && (
                  <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-2xl">
                    {filteredPatients.slice(0, 10).map((patient) => (
                      <button
                        key={patient.id}
                        onClick={() => handlePatientSelect(patient)}
                        className={`w-full text-left px-3 py-2 text-sm transition border-b border-slate-200 last:border-b-0 ${
                          selectedPatient?.id === patient.id
                            ? 'bg-sky-100 text-sky-900 font-medium'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="font-medium">{patient.full_name}</div>
                        <div className="text-xs text-slate-500">{patient.phone}</div>
                      </button>
                    ))}
                  </div>
                )}

                {selectedPatient && (
                  <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3">
                    <div className="text-xs font-medium text-slate-700 mb-1">Selected Patient</div>
                    <div className="font-semibold text-sky-900">{selectedPatient.full_name}</div>
                    <div className="text-xs text-sky-700 mt-1">Gender: {selectedPatient.gender}</div>
                    <div className="text-xs text-sky-700">Blood Group: {selectedPatient.blood_group || 'N/A'}</div>
                    <button
                      onClick={() => {
                        setSelectedPatient(null)
                        setSearchInput('')
                      }}
                      className="mt-2 text-xs font-medium text-sky-600 hover:text-sky-700 underline"
                    >
                      Change patient
                    </button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </aside>

        {/* Main content - full width form */}
        <div className="flex-1">
          <Card title="Record Vitals">
            {status.message && (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm font-medium mb-4 ${
                  status.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-rose-200 bg-rose-50 text-rose-700'
                }`}
              >
                {status.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Vital Signs Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Temperature */}
                <label className="space-y-1">
                  <span className="text-xs font-semibold text-slate-700">Temperature (°C)</span>
                  <Input
                    type="number"
                    step="0.1"
                    min="35"
                    max="43"
                    name="temperature_celsius"
                    value={form.temperature_celsius}
                    onChange={handleChange}
                    placeholder="36.5"
                  />
                  <div className="text-xs text-slate-500">Normal: 36.5 - 37.5°C</div>
                </label>

                {/* Heart Rate */}
                <label className="space-y-1">
                  <span className="text-xs font-semibold text-slate-700">Heart Rate (bpm)</span>
                  <Input
                    type="number"
                    min="30"
                    max="200"
                    name="heart_rate"
                    value={form.heart_rate}
                    onChange={handleChange}
                    placeholder="72"
                  />
                  <div className="text-xs text-slate-500">Normal: 60 - 100 bpm</div>
                </label>

                {/* Systolic BP */}
                <label className="space-y-1">
                  <span className="text-xs font-semibold text-slate-700">Systolic BP (mmHg)</span>
                  <Input
                    type="number"
                    min="60"
                    max="250"
                    name="systolic_bp"
                    value={form.systolic_bp}
                    onChange={handleChange}
                    placeholder="120"
                  />
                  <div className="text-xs text-slate-500">Normal: 90 - 120 mmHg</div>
                </label>

                {/* Diastolic BP */}
                <label className="space-y-1">
                  <span className="text-xs font-semibold text-slate-700">Diastolic BP (mmHg)</span>
                  <Input
                    type="number"
                    min="40"
                    max="180"
                    name="diastolic_bp"
                    value={form.diastolic_bp}
                    onChange={handleChange}
                    placeholder="80"
                  />
                  <div className="text-xs text-slate-500">Normal: 60 - 80 mmHg</div>
                </label>

                {/* Respiratory Rate */}
                <label className="space-y-1">
                  <span className="text-xs font-semibold text-slate-700">Respiratory Rate (breaths/min)</span>
                  <Input
                    type="number"
                    min="5"
                    max="60"
                    name="respiratory_rate"
                    value={form.respiratory_rate}
                    onChange={handleChange}
                    placeholder="16"
                  />
                  <div className="text-xs text-slate-500">Normal: 12 - 20 breaths/min</div>
                </label>

                {/* Oxygen Saturation */}
                <label className="space-y-1">
                  <span className="text-xs font-semibold text-slate-700">Oxygen Saturation (%)</span>
                  <Input
                    type="number"
                    step="0.1"
                    min="50"
                    max="100"
                    name="oxygen_saturation"
                    value={form.oxygen_saturation}
                    onChange={handleChange}
                    placeholder="98"
                  />
                  <div className="text-xs text-slate-500">Normal: 95 - 100%</div>
                </label>

                {/* Weight */}
                <label className="space-y-1">
                  <span className="text-xs font-semibold text-slate-700">Weight (kg)</span>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    name="weight_kg"
                    value={form.weight_kg}
                    onChange={handleChange}
                    placeholder="70"
                  />
                </label>

                {/* Height */}
                <label className="space-y-1">
                  <span className="text-xs font-semibold text-slate-700">Height (cm)</span>
                  <Input
                    type="number"
                    min="0"
                    name="height_cm"
                    value={form.height_cm}
                    onChange={handleChange}
                    placeholder="175"
                  />
                </label>
              </div>

              {/* Notes */}
              <label className="space-y-1">
                <span className="text-xs font-semibold text-slate-700">Notes</span>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Any additional observations or notes..."
                  className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-900 outline-none transition duration-150 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  rows="3"
                />
              </label>

              {/* Submit Button */}
              <div className="flex gap-3 pt-2">
                <div className="flex-1">
                  <Button type="submit" disabled={!selectedPatient || loading}>
                    {loading ? 'Recording...' : 'Record Vital Signs'}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      </div>

      {/* Vital History */}
      {selectedPatient && vitalHistory.length > 0 && (
        <Card title="Vital History">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 font-semibold text-slate-700">Date/Time</th>
                  <th className="text-center py-2 px-3 font-semibold text-slate-700">Temperature</th>
                  <th className="text-center py-2 px-3 font-semibold text-slate-700">BP</th>
                  <th className="text-center py-2 px-3 font-semibold text-slate-700">HR</th>
                  <th className="text-center py-2 px-3 font-semibold text-slate-700">RR</th>
                  <th className="text-center py-2 px-3 font-semibold text-slate-700">O₂ Sat</th>
                  <th className="text-center py-2 px-3 font-semibold text-slate-700">BMI</th>
                </tr>
              </thead>
              <tbody>
                {vitalHistory.slice(0, 10).map((vital) => {
                  const tempStatus = getVitalStatus(vital, 'temperature_celsius')
                  const bpStatus = getVitalStatus(vital, 'systolic_bp')
                  const hrStatus = getVitalStatus(vital, 'heart_rate')
                  const rrStatus = getVitalStatus(vital, 'respiratory_rate')
                  const o2Status = getVitalStatus(vital, 'oxygen_saturation')

                  return (
                    <tr key={vital.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="py-3 px-3 text-slate-600">
                        {new Date(vital.created_at).toLocaleString()}
                      </td>
                      <td className={`py-3 px-3 text-center text-xs font-medium rounded ${getStatusBadgeColor(tempStatus)}`}>
                        {vital.temperature_celsius ? `${vital.temperature_celsius}°C` : '-'}
                      </td>
                      <td className={`py-3 px-3 text-center text-xs font-medium rounded ${getStatusBadgeColor(bpStatus)}`}>
                        {vital.systolic_bp && vital.diastolic_bp
                          ? `${vital.systolic_bp}/${vital.diastolic_bp}`
                          : '-'}
                      </td>
                      <td className={`py-3 px-3 text-center text-xs font-medium rounded ${getStatusBadgeColor(hrStatus)}`}>
                        {vital.heart_rate ? `${vital.heart_rate}` : '-'}
                      </td>
                      <td className={`py-3 px-3 text-center text-xs font-medium rounded ${getStatusBadgeColor(rrStatus)}`}>
                        {vital.respiratory_rate ? `${vital.respiratory_rate}` : '-'}
                      </td>
                      <td className={`py-3 px-3 text-center text-xs font-medium rounded ${getStatusBadgeColor(o2Status)}`}>
                        {vital.oxygen_saturation ? `${vital.oxygen_saturation}%` : '-'}
                      </td>
                      <td className="py-3 px-3 text-center text-xs font-medium text-slate-700">
                        {vital.bmi ? `${vital.bmi}` : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {selectedPatient && vitalHistory.length === 0 && (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-sm text-slate-600">No vital history available for this patient yet</p>
        </div>
      )}
    </div>
  )
}
