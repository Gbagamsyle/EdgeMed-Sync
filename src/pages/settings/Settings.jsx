import { useEffect, useState } from 'react'
import logo from '../../assets/logo.png'

const STORAGE_KEY = 'edge-health-settings'

const defaultSettings = {
  notifications: true,
  offlineSync: true,
  autoRefresh: false,
}

export default function Settings() {
  const [settings, setSettings] = useState(() => {
    if (typeof window === 'undefined') return defaultSettings

    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) return defaultSettings

    try {
      return { ...defaultSettings, ...JSON.parse(saved) }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
      return defaultSettings
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  const toggleSetting = (key) => {
    setSettings((current) => ({ ...current, [key]: !current[key] }))
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 p-8 text-white shadow-[0_35px_80px_-24px_rgba(15,23,42,0.35)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10 p-2 shadow-lg backdrop-blur">
              <img src={logo} alt="EdgeMed logo" className="h-10 w-10 object-contain" />
            </div>
            <div className="max-w-2xl">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200">Admin console</p>
              <h1 className="text-3xl font-semibold tracking-tight">Platform settings</h1>
              <p className="mt-3 text-sm leading-6 text-slate-200">
                Fine-tune your operational environment with premium controls for access, notifications, and sync behavior.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-100">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              All systems healthy
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
              <div className="rounded-xl bg-white/10 px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">Security</p>
                <p className="font-semibold text-white">Enterprise grade</p>
              </div>
              <div className="rounded-xl bg-white/10 px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">Alerts</p>
                <p className="font-semibold text-white">Realtime delivery</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.25)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Account</h2>
              <p className="mt-2 text-sm text-slate-600">Maintain a polished, secure profile for your admin workspace.</p>
            </div>
            <div className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700">
              Profile
            </div>
          </div>

          <div className="mt-6 space-y-3 text-sm text-slate-700">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Profile settings</p>
              <p className="mt-1 text-slate-600">Edit your name, role, and contact information in the user profile section.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Security</p>
              <p className="mt-1 text-slate-600">Enable stronger authentication and manage any connected sessions.</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.25)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">System</h2>
              <p className="mt-2 text-sm text-slate-600">Configure automation, notifications, and resilient sync behavior.</p>
            </div>
            <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
              Live
            </div>
          </div>

          <div className="mt-6 space-y-3 text-sm text-slate-700">
            <button
              type="button"
              onClick={() => toggleSetting('notifications')}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-cyan-50/70"
            >
              <div>
                <p className="font-semibold text-slate-900">Notifications</p>
                <p className="mt-1 text-slate-600">Receive alerts for patient events and workflow updates.</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${settings.notifications ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                {settings.notifications ? 'Enabled' : 'Disabled'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => toggleSetting('offlineSync')}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-cyan-50/70"
            >
              <div>
                <p className="font-semibold text-slate-900">Offline sync</p>
                <p className="mt-1 text-slate-600">Keep local record changes queued when connectivity is interrupted.</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${settings.offlineSync ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                {settings.offlineSync ? 'Enabled' : 'Disabled'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => toggleSetting('autoRefresh')}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-cyan-50/70"
            >
              <div>
                <p className="font-semibold text-slate-900">Auto refresh</p>
                <p className="mt-1 text-slate-600">Refresh dashboard metrics automatically when the page is active.</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${settings.autoRefresh ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                {settings.autoRefresh ? 'Enabled' : 'Disabled'}
              </span>
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
