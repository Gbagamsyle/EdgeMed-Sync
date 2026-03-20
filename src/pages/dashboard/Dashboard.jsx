import { useAuth } from '../../context/AuthContext'

export default function Dashboard() {
  const { profile } = useAuth()

  const stats = [
    { label: 'Active Patients', value: '5,428', icon: 'group', color: 'bg-cyan-500/10 text-cyan-700 border-cyan-200' },
    { label: 'Daily Scans', value: '12,304', icon: 'qr_code_scanner', color: 'bg-indigo-500/10 text-indigo-700 border-indigo-200' },
    { label: 'AI Alerts', value: '372', icon: 'bolt', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200' },
    { label: 'Staff Online', value: '188', icon: 'medical_services', color: 'bg-violet-500/10 text-violet-700 border-violet-200' },
  ]

  const role = (profile?.role || 'receptionist').toLowerCase()

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: '#262931' }}>Welcome back, {profile?.full_name ?? 'Team'}</h1>
            <p className="mt-1 text-sm text-slate-500">Role: {role.charAt(0).toUpperCase()+role.slice(1)}. Here’s your operational snapshot.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap">Refresh</button>
            {role === 'receptionist' ? (
              <a href="/dashboard/patients/add" className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 whitespace-nowrap">Add Patient</a>
            ) : (
              <button className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 whitespace-nowrap">New patient</button>
            )}
          </div>
        </div>
      </section>

      {role === 'receptionist' && (
        <section className="mb-6 rounded-2xl border border-sky-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold mb-3 heading-dark">Receptionist Workflow</h2>
          <p className="text-sm text-slate-600 mb-3">
            This section shows your daily workflow. Follow the steps to register a patient, create their secure QR profile, and access patient records quickly.
          </p>
          <ol className="space-y-2 text-sm text-slate-700 list-decimal list-inside">
            <li>
              Collect patient info (name, phone, gender, address) and click <strong>Add Patient</strong>.
            </li>
            <li>
              The system stores the patient in the database and assigns a QR code automatically when the record is created.
            </li>
            <li>
              Give the patient their QR code (printed or digital) for secure check-in.
            </li>
            <li>
              For future appointments, scan the QR code through <strong>QR Scan</strong> to load the patient profile and past records instantly.
            </li>
          </ol>
          <div className="mt-4 flex gap-3">
            <a href="/dashboard/patients/add" className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500">Add Patient</a>
            <a href="/dashboard/patients" className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">View Patient List</a>
          </div>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <article key={item.label} className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-md ${item.color}`}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</span>
              <span className="material-symbols-outlined text-xl text-slate-500">{item.icon}</span>
            </div>
            <div className="text-3xl font-bold text-slate-900">{item.value}</div>
            <div className="mt-2 text-xs text-slate-400">Compared to last week: <span className="font-semibold text-slate-700">+8.4%</span></div>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
          <h2 className="text-lg font-bold text-slate-900 heading-dark">Recent Activity</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            <li>✔️ New patient record created - ID #8569</li>
            <li>⚡ AI alert triage raised for patient #332</li>
            <li>🩺 Dr. Tan requested MRI follow-up</li>
            <li>📅 Appointment schedule updated (27 total today)</li>
          </ul>
        </div>

        {role === 'receptionist' ? (
          <div className="rounded-2xl border border-sky-200 bg-white p-6 shadow-md">
            <h2 className="text-lg font-bold text-sky-800 heading-dark">Receptionist Snapshot</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li>🕒 Checked-in patients: <span className="font-semibold text-cyan-600">14</span></li>
              <li>📌 Today’s bookings: <span className="font-semibold text-indigo-600">42</span></li>
              <li>🆕 New registrations: <span className="font-semibold text-emerald-600">8</span></li>
              <li>📱 QR scans handled: <span className="font-semibold text-violet-600">29</span></li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href="/dashboard/patients" className="inline-flex items-center rounded-lg border border-sky-300 bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition duration-150 ease-in-out hover:bg-sky-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2">Go to patient list</a>
              <a href="/dashboard/qr/scan" className="inline-flex items-center rounded-lg border border-cyan-300 bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition duration-150 ease-in-out hover:bg-cyan-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2">Open QR scanner</a>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
            <h2 className="text-lg font-bold text-slate-900 heading-dark">System health</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <p className="font-medium text-slate-800">Server uptime: <span className="text-emerald-600">99.96%</span></p>
              <p>API response: <span className="font-semibold text-sky-600">215 ms</span></p>
              <p>Supabase connections: <span className="font-semibold text-indigo-600">452</span></p>
              <p>Pending workflow tasks: <span className="font-semibold text-orange-600">18</span></p>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
