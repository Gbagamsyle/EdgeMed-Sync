/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (id, authUser = null) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('fetchProfile error:', error)
      setProfile({
        id,
        full_name: authUser?.user_metadata?.full_name || authUser?.email || 'Staff member',
        role: authUser?.user_metadata?.role || 'receptionist',
        is_staff: true,
      })
      return
    }

    setProfile(data || {
      id,
      full_name: authUser?.user_metadata?.full_name || authUser?.email || 'Staff member',
      role: authUser?.user_metadata?.role || 'receptionist',
      is_staff: true,
    })
  }

  const login = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    setUser(data.user ?? null)
    if (data.user) {
      await fetchProfile(data.user.id, data.user)
    }
    return data
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setProfile(null)
  }

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      const sessionUser = data.session?.user ?? null
      setUser(sessionUser)

      if (sessionUser) {
        await fetchProfile(sessionUser.id, sessionUser)
      }

      setLoading(false)
    }

    void getSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null
      setUser(sessionUser)
      if (sessionUser) {
        void fetchProfile(sessionUser.id, sessionUser)
      } else {
        setProfile(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
