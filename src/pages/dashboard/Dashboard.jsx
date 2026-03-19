import { Link } from 'react-router-dom'

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-800">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between py-6 px-4 sm:px-6 lg:px-8">
        <div className="text-xl font-black text-slate-900">EdgeMed Sync</div>
        <nav className="flex items-center gap-3">
          <Link className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100" to="/auth/login">Login</Link>
          <Link className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700" to="/auth/register">Register</Link>
        </nav>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl mx-auto w-full max-w-7xl md:p-10">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">Hospital intelligence, simplified</h1>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              EdgeMed Sync connects staff, patients and edge-AI diagnostics in one secure platform. Enable QR check-ins, real-time triage, and transparent reporting for every care path.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-700" to="/auth/register">Start free trial</Link>
              <Link className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100" to="/auth/login">Demo login</Link>
            </div>
          </div>
          <div className="space-y-4">
            <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <h3 className="text-sm font-semibold text-emerald-700">💡 24-hour support SLA</h3>
              <p className="text-sm text-emerald-700">Guaranteed response for incidents and compliance queries.</p>
            </article>
            <article className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <h3 className="text-sm font-semibold text-blue-700">🔒 HIPAA / GDPR compliant</h3>
              <p className="text-sm text-blue-700">Encrypted data flow and audit-ready logs across all transactions.</p>
            </article>
            <article className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
              <h3 className="text-sm font-semibold text-indigo-700">⚡ Real-time edge AI</h3>
              <p className="text-sm text-indigo-700">Instant diagnosis priority scoring with low-latency device sync.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-5 py-10 md:grid-cols-2 xl:grid-cols-4">
        {[
          { title: 'Active Patients', value: '5,428' },
          { title: 'Daily QR scans', value: '12,304' },
          { title: 'AI case alerts', value: '372' },
          { title: 'Integrated apps', value: '28+' },
        ].map((stat) => (
          <article key={stat.title} className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-wider text-slate-500">{stat.title}</div>
            <div className="mt-3 text-3xl font-bold text-slate-900">{stat.value}</div>
          </article>
        ))}
      </section>

      <section className="mx-auto w-full max-w-7xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Why organizations choose EdgeMed Sync</h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          <li className="rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900">Centralized insights</h3>
            <p className="mt-2 text-sm text-slate-600">One platform for patient flow, diagnostics, and outcomes.</p>
          </li>
          <li className="rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900">Patient empowerment</h3>
            <p className="mt-2 text-sm text-slate-600">QR-based access and self-service consent management.</p>
          </li>
          <li className="rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900">Compliance and security</h3>
            <p className="mt-2 text-sm text-slate-600">Audit logs, encrypted storage, role-based control.</p>
          </li>
        </ul>
      </section>
    </main>
  )
}
