/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const { profile } = useAuth()
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    if (profile?.role !== 'doctor') return undefined

    const channel = supabase
      .channel(`doctor-lab-results-${profile.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lab_results' }, (payload) => {
        const result = payload.new
        setNotification({
          id: result.id,
          patientId: result.patient_id,
          testName: result.test_name,
          resultValue: result.result_value,
        })
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [profile?.id, profile?.role])

  const dismissNotification = () => setNotification(null)

  return (
    <NotificationContext.Provider value={{ notification, dismissNotification }}>
      {children}
      {notification ? (
        <div className="fixed right-4 top-28 z-[100] w-[min(24rem,calc(100vw-2rem))]" role="status" aria-live="polite">
          <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-[0_18px_50px_-20px_rgba(15,23,42,0.45)]">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700" aria-hidden="true">✓</div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Laboratory result received</p>
                <p className="mt-1 text-sm font-bold text-slate-950">{notification.testName}</p>
                <p className="mt-1 truncate text-sm text-slate-600">{notification.resultValue}</p>
                <a href={`/dashboard/patients/${notification.patientId}/records`} onClick={dismissNotification} className="mt-3 inline-flex text-sm font-bold text-sky-700 hover:text-sky-800 focus:outline-none focus:underline">Review patient record</a>
              </div>
              <button type="button" onClick={dismissNotification} aria-label="Dismiss laboratory result notification" className="rounded-lg px-2 py-1 text-lg leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500">×</button>
            </div>
          </div>
        </div>
      ) : null}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationContext)
