import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function DashboardLayout() {
  return (
    <div className="h-screen bg-slate-50">
      <Navbar />
      <div className="flex pt-24">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 ml-60">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
