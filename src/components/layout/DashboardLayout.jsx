import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <div className="flex pt-24 min-h-[calc(100vh-6rem)] bg-slate-100">
        <Sidebar />
        <main className="flex-1 min-h-[calc(100vh-6rem)] overflow-y-auto bg-slate-100 p-6 ml-60">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
