import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabaseClient'

export default function Navbar() {
  const { profile } = useAuth()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const rawRole = profile?.role
  const displayRole = rawRole ? String(rawRole).trim() : null

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-24 items-center justify-between border-b border-sky-700 bg-sky-600 px-6 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-white/20 shadow-inner" />
        <div className="flex flex-col justify-center gap-1">
          <h1 className="text-lg font-bold tracking-wide text-white">EdgeMed Dashboard</h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="rounded-md px-3 py-2 text-right text-sm">
          <p className="font-semibold text-white">{profile?.full_name ?? 'Guest'}</p>
          <p className="text-sky-200">{displayRole ? displayRole.charAt(0).toUpperCase() + displayRole.slice(1) : 'Visitor'}</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-md bg-red-500 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </header>
  )
}
