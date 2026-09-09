import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  HeartPulse,
  LayoutDashboard,
  QrCode,
  Settings,
  Stethoscope,
  UserPlus,
  Users,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/logo.png'

const commonItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/dashboard/qr/scan', label: 'QR Scan', icon: QrCode },
]

const roleItems = {
  admin: [
    { to: '/dashboard/patients', label: 'Patients', icon: Users },
    { to: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
    { to: '/dashboard/settings', label: 'Settings', icon: Settings },
  ],
  doctor: [
    { to: '/dashboard/patients', label: 'Patients', icon: Users },
    { to: '/dashboard/diagnosis', label: 'Diagnosis', icon: Stethoscope },
    { to: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
  ],
  clinician: [
    { to: '/dashboard/patients', label: 'Patients', icon: Users },
    { to: '/dashboard/diagnosis', label: 'Diagnosis', icon: Stethoscope },
    { to: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
  ],
  receptionist: [
    { to: '/dashboard/patients', label: 'Patients', icon: Users },
    { to: '/dashboard/patients/add', label: 'Add Patient', icon: UserPlus },
  ],
  nurse: [
    { to: '/dashboard/patients', label: 'Patients', icon: Users },
    { to: '/dashboard/vitals', label: 'Vitals', icon: HeartPulse },
  ],
}

export default function Sidebar() {
  const { profile } = useAuth()
  const rawRole = profile?.role
  const role = rawRole ? String(rawRole).trim().toLowerCase() : 'receptionist'
  const navItems = [...commonItems, ...(roleItems[role] || roleItems.receptionist)]

  return (
    <aside className="fixed left-0 top-24 h-[calc(100vh-6rem)] w-60 overflow-y-auto border-r border-sky-700 bg-sky-600 text-white shadow-xl">
      <div className="h-full p-4">
        <section className="mb-4 rounded-xl border border-sky-700 bg-sky-700/80 p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 p-1.5">
              <img src={logo} alt="Edge-Health logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-white">Edge-Health Command</h2>
              <p className="text-[10px] text-sky-100/80">AI hospital operations</p>
            </div>
          </div>
        </section>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg'
                    : 'text-white hover:bg-sky-700 hover:text-cyan-100'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-6 rounded-lg border border-sky-700 bg-sky-700/80 p-3 text-xs text-white">
          <p className="mb-1 font-semibold text-cyan-100">Tip</p>
          <p>Use dashboard cards to monitor KPIs and alerts at a glance.</p>
        </div>
      </div>
    </aside>
  )
}
