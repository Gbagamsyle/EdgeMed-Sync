import { NavLink } from 'react-router-dom'

export default function Sidebar() {
  return (
    <aside className="w-60 p-4 bg-slate-100">
      <ul className="space-y-2">
        <li><NavLink to="/" className={({isActive}) => isActive ? 'font-bold' : ''}>Overview</NavLink></li>
        <li><NavLink to="/patients" className={({isActive}) => isActive ? 'font-bold' : ''}>Patients</NavLink></li>
        <li><NavLink to="/diagnosis" className={({isActive}) => isActive ? 'font-bold' : ''}>Diagnosis</NavLink></li>
        <li><NavLink to="/qr/scan" className={({isActive}) => isActive ? 'font-bold' : ''}>QR Scan</NavLink></li>
      </ul>
    </aside>
  )
}
