import { useEffect, useState } from 'react'
import { ShieldCheck, UserCog } from 'lucide-react'
import { getStaffProfiles, updateStaffRole } from '../../services/workflowService'

const roles = ['admin', 'doctor', 'lab_technician', 'nurse', 'receptionist']

export default function StaffManagement() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const loadStaff = async () => {
    setLoading(true)
    const { data, error } = await getStaffProfiles()
    if (error) setMessage(error.message)
    else setStaff(data || [])
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadStaff() }, [])

  const changeRole = async (id, role) => {
    const { data, error } = await updateStaffRole(id, role)
    if (error) {
      setMessage(error.message)
      return
    }
    setStaff((current) => current.map((member) => member.id === id ? { ...member, ...data } : member))
    setMessage('Staff role updated successfully.')
  }

  return (
    <div className="space-y-6">
      <header className="rounded-[1.75rem] bg-gradient-to-br from-sky-700 to-cyan-600 p-7 text-white shadow-sm"><div className="flex items-center gap-3"><div className="rounded-xl bg-white/15 p-3"><UserCog className="h-5 w-5" /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-100">Administration</p><h1 className="mt-1 text-3xl font-bold">Staff and roles</h1><p className="mt-2 text-sm text-sky-50">Review staff access and assign the role that matches each responsibility.</p></div></div></header>
      {message ? <p role="status" className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">{message}</p> : null}
      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-2 border-b border-slate-100 pb-4"><ShieldCheck className="h-5 w-5 text-sky-700" /><h2 className="font-bold text-slate-950">Staff directory</h2></div>{loading ? <p className="mt-5 text-sm text-slate-500">Loading staff…</p> : <div className="mt-5 divide-y divide-slate-100">{staff.map((member) => <div key={member.id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-slate-950">{member.full_name || 'Unnamed staff member'}</p><p className="mt-1 text-xs text-slate-500">{member.id}</p></div><select value={member.role} onChange={(event) => void changeRole(member.id, event.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm capitalize text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100">{roles.map((role) => <option key={role} value={role}>{role.replace('_', ' ')}</option>)}</select></div>)}</div>}</section>
    </div>
  )
}
