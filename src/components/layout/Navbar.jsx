import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between p-4 bg-slate-900 text-white">
      <div className="font-bold">Edge AI Hospital</div>
      <div className="space-x-3">
        <Link to="/" className="hover:underline">Dashboard</Link>
        <Link to="/patients" className="hover:underline">Patients</Link>
        <Link to="/reports" className="hover:underline">Reports</Link>
      </div>
    </nav>
  )
}
