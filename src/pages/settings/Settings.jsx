export default function Settings() {
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
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Notifications</p>
              <p className="mt-1 text-slate-600">Choose how and when to receive alerts for patient events.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Data sync</p>
              <p className="mt-1 text-slate-600">Manage offline sync behavior and API integration settings.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
