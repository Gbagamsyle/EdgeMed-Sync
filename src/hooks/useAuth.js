import { useState, useEffect } from 'react'

export default function useAuth() {
  const [user, setUser] = useState(null)
  useEffect(() => {
    // TODO: load user auth state from session
    setUser(null)
  }, [])
  return { user, login: () => {}, logout: () => {} }
}
