import { useEffect, useState } from 'react'

const STORAGE_KEY = 'edgemed-settings'

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
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_35px_80px_-24px_rgba(15,23,42,0.16)]">
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Manage app preferences, notification options, and system access within EdgeMed Sync.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Account</h2>
          <p className="mt-2 text-sm text-slate-600">Update your profile, change your password, and manage your login details.</p>
          <div className="mt-6 space-y-3 text-sm text-slate-700">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Profile settings</p>
              <p className="mt-1 text-slate-600">Edit your name, role, and contact information in the user profile section.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Security</p>
              <p className="mt-1 text-slate-600">Enable stronger authentication and manage any connected sessions.</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">System</h2>
          <p className="mt-2 text-sm text-slate-600">Configure backend integrations, notifications, and audit settings.</p>
          <div className="mt-6 space-y-3 text-sm text-slate-700">
            <button type="button" onClick={() => toggleSetting('notifications')} className="flex w-full items-center justify-between rounded-2xl bg-slate-50 p-4 text-left">
              <div>
                <p className="font-semibold text-slate-900">Notifications</p>
                <p className="mt-1 text-slate-600">Receive alerts for patient events and workflow updates.</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${settings.notifications ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                {settings.notifications ? 'Enabled' : 'Disabled'}
              </span>
            </button>
            <button type="button" onClick={() => toggleSetting('offlineSync')} className="flex w-full items-center justify-between rounded-2xl bg-slate-50 p-4 text-left">
              <div>
                <p className="font-semibold text-slate-900">Offline sync</p>
                <p className="mt-1 text-slate-600">Keep local record changes queued when connectivity is interrupted.</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${settings.offlineSync ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                {settings.offlineSync ? 'Enabled' : 'Disabled'}
              </span>
            </button>
            <button type="button" onClick={() => toggleSetting('autoRefresh')} className="flex w-full items-center justify-between rounded-2xl bg-slate-50 p-4 text-left">
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
