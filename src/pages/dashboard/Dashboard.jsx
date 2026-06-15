import { useAuth } from '../../context/AuthContext'

export default function Dashboard() {
  const { profile } = useAuth()

  const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : 'Doctor'

  const stats = [
    { label: 'Active Patients', value: '5,428', icon: 'group' },
    { label: 'Daily Scans', value: '12,304', icon: 'qr_code_scanner' },
    { label: 'AI Alerts', value: '372', icon: 'bolt' },
    { label: 'Staff Online', value: '188', icon: 'medical_services' },
  ]


  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <section className="mb-8 overflow-hidden rounded-[2.5rem] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-8 sm:p-12 shadow-[0_40px_80px_-20px_rgba(15,23,42,0.15)]">
        <div className="grid gap-8 lg:grid-cols-[2fr_1.2fr] lg:items-start">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-50 px-3 py-1">
                <span className="material-symbols-outlined text-xs text-slate-500">badge</span>
                <span className="text-xs font-semibold text-slate-700">{profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'User'}</span>
              </div>
            </div>
            <div>
              <h1 className="text-5xl font-bold tracking-tight text-slate-900">Welcome back, {firstName}</h1>
              <p className="mt-3 max-w-xl text-lg leading-relaxed text-slate-600">Stay on top of your patient care with real-time KPIs, quick actions, and priority tasks—all in one unified hub.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 pt-2">
              <button aria-label="Refresh dashboard" className="group flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50">
                <span className="material-symbols-outlined text-base transition group-hover:rotate-180">refresh</span>
                <span>Refresh</span>
              </button>
              <a href="/dashboard/patients" className="group flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-600 px-6 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl hover:from-sky-700 hover:to-cyan-700">
                <span className="material-symbols-outlined text-base">people</span>
                <span>Manage Patients</span>
              </a>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-sky-50 via-slate-50 to-cyan-50 p-6 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-sky-700">Priority Action</p>
                  <h2 className="mt-2 text-xl font-bold text-slate-900">Patient Intake Review</h2>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <span className="material-symbols-outlined text-base text-sky-600">checklist</span>
                </span>
              </div>
            <p className="text-sm leading-6 text-slate-600">Review latest registrations, activate QR codes, and process any pending alerts before shift change.</p>
            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-xs">
                <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                  <span className="material-symbols-outlined text-sm text-emerald-600">person_add</span>
                </span>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-600">New registrations</p>
                  <p className="text-lg font-bold text-slate-900">8</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-xs">
                <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                  <span className="material-symbols-outlined text-sm text-blue-600">qr_code_scanner</span>
                </span>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-600">Pending scans</p>
                  <p className="text-lg font-bold text-slate-900">14</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const iconColors = {
            group: { bg: 'bg-cyan-100', text: 'text-cyan-600' },
            qr_code_scanner: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
            bolt: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
            medical_services: { bg: 'bg-violet-100', text: 'text-violet-600' },
          }

          const colors = iconColors[item.icon] || { bg: 'bg-slate-100', text: 'text-slate-400' }
          
          return (
            <article key={item.label} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg hover:border-slate-300">
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{item.label}</span>
                  <div className={`${colors.bg} inline-flex flex-shrink-0 h-10 w-10 items-center justify-center rounded-lg`}>
                    <span className={`material-symbols-outlined ${colors.text} text-lg`}>{item.icon}</span>
                  </div>
                </div>
                <div className="mb-1 text-3xl font-bold tracking-tight text-slate-900">{item.value}</div>
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-emerald-600">↑ 8.4%</span> from last week
                </p>
              </div>
            </article>
          )
        })}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Recent activity</h2>
              <p className="mt-1 text-sm text-slate-500">Latest actions in the system</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
              <span className="material-symbols-outlined text-slate-600">history</span>
            </span>
          </div>
          <ul className="mt-6 space-y-3">
            <li className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-emerald-100">
                <span className="material-symbols-outlined text-emerald-600 text-base">check</span>
              </span>
              <span>New patient record created - ID #8569</span>
            </li>
            <li className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-amber-100">
                <span className="material-symbols-outlined text-amber-600 text-base">warning</span>
              </span>
              <span>AI alert triage raised for patient #332</span>
            </li>
            <li className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-cyan-100">
                <span className="material-symbols-outlined text-cyan-600 text-base">medical_services</span>
              </span>
              <span>Dr. Tan requested MRI follow-up</span>
            </li>
            <li className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-violet-100">
                <span className="material-symbols-outlined text-violet-600 text-base">event</span>
              </span>
              <span>Appointment scheduled (27 total today)</span>
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">System health</h2>
              <p className="mt-1 text-sm text-slate-500">Platform metrics</p>
            </div>
            <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
              <span className="material-symbols-outlined text-slate-600">dashboard</span>
            </span>
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm text-slate-700">Server uptime</p>
              <p className="font-bold text-slate-900">99.96%</p>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm text-slate-700">API response</p>
              <p className="font-bold text-slate-900">215 ms</p>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm text-slate-700">DB connections</p>
              <p className="font-bold text-slate-900">452</p>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm text-slate-700">Pending tasks</p>
              <p className="font-bold text-slate-900">18</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <a href="/dashboard/patients" className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-md hover:border-slate-300">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-50 mb-4">
            <span className="material-symbols-outlined text-xl text-cyan-600">people</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900">Manage Patients</h3>
          <p className="mt-2 text-sm text-slate-600">View, add, and update patient records.</p>
        </a>

        <a href="/dashboard/diagnosis" className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-md hover:border-slate-300">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 mb-4">
            <span className="material-symbols-outlined text-xl text-emerald-600">health_and_safety</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900">Diagnosis</h3>
          <p className="mt-2 text-sm text-slate-600">Create and manage patient diagnoses.</p>
        </a>

        <a href="/dashboard/qr-scan" className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-md hover:border-slate-300">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 mb-4">
            <span className="material-symbols-outlined text-xl text-indigo-600">qr_code_2</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900">QR Scanner</h3>
          <p className="mt-2 text-sm text-slate-600">Quickly access patient information.</p>
        </a>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Need help?</h2>
            <p className="mt-1 text-sm text-slate-600">Check documentation or contact support</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
            <span className="material-symbols-outlined text-base">help</span>
            View Docs
          </button>
        </div>
      </section>
    </main>
  )
}
