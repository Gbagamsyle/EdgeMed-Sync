import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getPatients } from '../../services/patientService'
import { BACKEND_URL } from '../../services/config'
import { diagnosisService } from '../../services/diagnosisService'
import { supabase } from '../../services/supabaseClient'
import { recordQueue } from '../../utils/dexieDb'

const formatCount = (value) => new Intl.NumberFormat().format(value)
const formatPercent = (value) => `${Math.round(value)}%`
const parseAuditDetails = (details) => {
  if (!details) return null
  if (typeof details !== 'string') return String(details)

  try {
    const parsed = JSON.parse(details)
    if (typeof parsed === 'string') return parsed
    if (parsed?.message) return parsed.message
    if (Object.keys(parsed).length) return Object.values(parsed).join(' · ')
  } catch {
    return details
  }

  return details
}

export default function Dashboard() {
  const { profile } = useAuth()
  const [patients, setPatients] = useState([])
  const [auditActivity, setAuditActivity] = useState([])
  const [queueStats, setQueueStats] = useState({ total: 0, pending: 0, failed: 0, synced: 0 })
  const [deviceHealth, setDeviceHealth] = useState({
    status: navigator.onLine ? 'online' : 'offline',
    pendingSync: 0,
    storagePercent: 0,
    storageLabel: 'Unavailable',
    connection: navigator.connection?.effectiveType || 'Unknown',
  })
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingHealth, setLoadingHealth] = useState(true)
  const [aiHealth, setAiHealth] = useState({ status: 'unknown', error: null })

  const isAdmin = profile?.role ? profile.role.trim().toLowerCase() === 'admin' : false
  const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : isAdmin ? 'Admin' : 'Doctor'

  const loadMetrics = async () => {
    setLoadingStats(true)
    setLoadingHealth(true)

    const patientResult = await getPatients()
    if (!patientResult.error) {
      setPatients(patientResult.data || [])
    } else {
      console.error('Failed to load dashboard metrics:', patientResult.error)
      setPatients([])
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      const auditResp = await fetch(`${BACKEND_URL}/api/audit/logs?limit=4`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })

      if (auditResp.ok) {
        const payload = await auditResp.json()
        setAuditActivity(payload.logs || [])
      } else {
        console.error('Failed to load recent activity:', await auditResp.text())
        setAuditActivity([])
      }
    } catch (err) {
      console.error('Failed to load recent activity:', err)
      setAuditActivity([])
    }

    try {
      const health = await diagnosisService.checkStatus()
      setAiHealth({ status: health.status || 'offline', error: health.error || null })
    } catch (err) {
      setAiHealth({ status: 'offline', error: err.message })
    }

    try {
      const stats = await recordQueue.getStats()
      setQueueStats(stats)
      const pendingUploads = (stats.pending || 0) + (stats.failed || 0)

      let storagePercent = 0
      let storageLabel = 'Unavailable'

      if (navigator.storage && typeof navigator.storage.estimate === 'function') {
        const estimate = await navigator.storage.estimate()
        if (estimate?.quota) {
          storagePercent = Math.min(100, ((estimate.usage || 0) / estimate.quota) * 100)
          storageLabel = `${(estimate.usage / 1024 / 1024).toFixed(1)} MB / ${(estimate.quota / 1024 / 1024).toFixed(1)} MB`
        }
      }

      setDeviceHealth({
        status: navigator.onLine ? 'online' : 'offline',
        pendingSync: pendingUploads,
        storagePercent,
        storageLabel,
        connection: navigator.connection?.effectiveType || 'Unknown',
      })
    } catch (err) {
      console.warn('Dashboard queue/device health unavailable:', err)
      setQueueStats({ total: 0, pending: 0, failed: 0, synced: 0 })
      setDeviceHealth({
        status: navigator.onLine ? 'online' : 'offline',
        pendingSync: 0,
        storagePercent: 0,
        storageLabel: 'Unavailable',
        connection: navigator.connection?.effectiveType || 'Unknown',
      })
    }

    setLoadingStats(false)
    setLoadingHealth(false)
  }

  useEffect(() => {
    const init = async () => {
      await loadMetrics()
    }

    void init()
  }, [])

  const totalPatients = patients.length
  const qrReadyPatients = patients.filter((patient) => patient?.qr_code).length
  const recentRegistrations = patients.filter((patient) => {
    if (!patient?.created_at) return false

    const createdAt = new Date(patient.created_at)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 7)

    return createdAt >= cutoff
  }).length
  const recordsToday = patients.filter((patient) => {
    if (!patient?.created_at) return false
    const createdAt = new Date(patient.created_at)
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    return createdAt >= todayStart
  }).length
  const signedInStaff = profile ? 1 : 0
  const qrCoverage = totalPatients ? (qrReadyPatients / totalPatients) * 100 : 0

  const stats = [
    { label: 'Active Patients', value: loadingStats ? '—' : formatCount(totalPatients), icon: 'group' },
    { label: 'QR-ready Patients', value: loadingStats ? '—' : formatCount(qrReadyPatients), icon: 'qr_code_scanner' },
    { label: 'New This Week', value: loadingStats ? '—' : formatCount(recentRegistrations), icon: 'bolt' },
    { label: 'Signed-in Staff', value: loadingStats ? '—' : formatCount(signedInStaff), icon: 'medical_services' },
  ]

  const healthMetrics = [
    { label: 'AI service', value: aiHealth.status === 'online' ? 'Online' : 'Offline', description: aiHealth.status === 'online' ? 'AI inference reachable' : aiHealth.error || 'Service unavailable' },
    { label: 'Device status', value: deviceHealth.status === 'online' ? 'Online' : 'Offline', description: `${deviceHealth.connection} network · ${deviceHealth.pendingSync} pending sync tasks` },
    { label: 'Offline queue', value: loadingHealth ? '—' : formatCount(queueStats.pending + queueStats.failed), description: 'Pending uploads waiting for network recovery' },
    { label: 'Storage used', value: loadingHealth ? '—' : `${Math.round(deviceHealth.storagePercent)}%`, description: deviceHealth.storageLabel },
  ]

  const actionCards = isAdmin
    ? [
        { title: 'Manage Patients', description: 'View, add, and update patient records.', href: '/dashboard/patients', icon: 'people' },
        { title: 'System Reports', description: 'Monitor performance and audit trends.', href: '/dashboard/reports', icon: 'analytics' },
        { title: 'Platform Settings', description: 'Adjust system preferences and security options.', href: '/dashboard/settings', icon: 'settings' },
      ]
    : [
        { title: 'Manage Patients', description: 'View, add, and update patient records.', href: '/dashboard/patients', icon: 'people' },
        { title: 'Diagnosis', description: 'Create and manage patient diagnoses.', href: '/dashboard/diagnosis', icon: 'health_and_safety' },
        { title: 'QR Scanner', description: 'Quickly access patient information.', href: '/dashboard/qr/scan', icon: 'qr_code_2' },
      ]

  const activityItems = auditActivity

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
              <button type="button" onClick={loadMetrics} aria-label="Refresh dashboard" className="group flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50">
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
                  <h2 className="mt-2 text-xl font-bold text-slate-900">{isAdmin ? 'System Oversight' : 'Patient Intake Review'}</h2>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <span className="material-symbols-outlined text-base text-sky-600">checklist</span>
                </span>
              </div>
            <p className="text-sm leading-6 text-slate-600">{isAdmin ? 'Review system alerts, audit logs, and platform health to keep operations running smoothly.' : 'Review latest registrations, activate QR codes, and process any pending alerts before shift change.'}</p>
            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-xs">
                <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                  <span className="material-symbols-outlined text-sm text-emerald-600">person_add</span>
                </span>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-600">New registrations</p>
                  <p className="text-lg font-bold text-slate-900">{loadingStats ? '—' : formatCount(recentRegistrations)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-xs">
                <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                  <span className="material-symbols-outlined text-sm text-blue-600">qr_code_scanner</span>
                </span>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-600">QR-ready patients</p>
                  <p className="text-lg font-bold text-slate-900">{loadingStats ? '—' : formatCount(qrReadyPatients)}</p>
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
              </div>
            </article>
          )
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.18)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500">System health</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Edge device status</h2>
            </div>
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${deviceHealth.status === 'online' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              <span className={`h-2.5 w-2.5 rounded-full ${deviceHealth.status === 'online' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {deviceHealth.status === 'online' ? 'Connected' : 'Offline'}
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Network</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{deviceHealth.connection}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Queue</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{deviceHealth.pendingSync}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Storage</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{Math.round(deviceHealth.storagePercent)}%</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              <span>storage usage</span>
              <span>{deviceHealth.storageLabel}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full ${deviceHealth.storagePercent > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(100, Math.max(6, deviceHealth.storagePercent))}%` }}
              />
            </div>
          </div>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-900 to-sky-900 p-6 text-white shadow-[0_20px_50px_-24px_rgba(14,116,144,0.6)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-cyan-200">Admin guardrails</p>
          <h2 className="mt-2 text-xl font-semibold">Operations summary</h2>
          <ul className="mt-6 space-y-4 text-sm text-slate-100">
            <li className="flex items-start gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" /> Queue status: {queueStats.pending + queueStats.failed} records need sync</li>
            <li className="flex items-start gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-400" /> AI reachability: {aiHealth.status === 'online' ? 'Operational' : 'Requires attention'}</li>
            <li className="flex items-start gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-violet-400" /> Records synced: {queueStats.synced}</li>
            <li className="flex items-start gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-400" /> Storage threshold: {deviceHealth.storagePercent > 75 ? 'Critical' : 'Healthy'}</li>
          </ul>
        </article>
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
            {activityItems.length > 0 ? (
              activityItems.map((entry) => {
                const label = parseAuditDetails(entry.details) || entry.event_type.replace(/_/g, ' ')
                const actor = entry.staff_name || entry.staff_id || 'System'
                const timestamp = entry.created_at ? new Date(entry.created_at).toLocaleString() : null

                return (
                  <li key={entry.id || `${entry.event_type}-${entry.created_at}`} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-slate-100 text-slate-600">
                        <span className="material-symbols-outlined text-base">task_alt</span>
                      </span>
                      <span className="font-medium text-slate-900">{label}</span>
                    </div>
                    <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-500">
                      <span>{actor}</span>
                      {timestamp ? <span>{timestamp}</span> : null}
                    </div>
                  </li>
                )
              })
            ) : (
              <li className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">No recent activity is available yet.</li>
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">System health</h2>
              <p className="mt-1 text-sm text-slate-500">Platform metrics based on live data</p>
            </div>
            <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
              <span className="material-symbols-outlined text-slate-600">dashboard</span>
            </span>
          </div>
          <div className="mt-6 space-y-3">
            {healthMetrics.map((metric) => (
              <div key={metric.label} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div>
                  <p className="text-sm text-slate-700">{metric.label}</p>
                  <p className="text-xs text-slate-500">{metric.description}</p>
                </div>
                <p className="font-bold text-slate-900">{metric.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {actionCards.map((card) => {
          if (card.title === 'QR Scanner') {
            return (
              <a key={card.title} href="/dashboard/qr/scan" className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-md hover:border-slate-300">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-slate-50 mb-4">
                  <span className="material-symbols-outlined text-xl text-slate-600">{card.icon}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{card.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{card.description}</p>
              </a>
            )
          }

          return (
            <a key={card.title} href={card.href} className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-md hover:border-slate-300">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-slate-50 mb-4">
                <span className="material-symbols-outlined text-xl text-slate-600">{card.icon}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{card.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{card.description}</p>
            </a>
          )
        })}
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
