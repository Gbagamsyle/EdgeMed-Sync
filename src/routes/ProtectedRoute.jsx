import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth()

  if (loading) return <p>Loading...</p>

  if (!user) return <Navigate to="/auth/login" replace />

  if (allowedRoles?.length) {
    const role = String(profile?.role || '').trim().toLowerCase()
    if (!allowedRoles.includes(role)) return <Navigate to="/dashboard" replace />
  }

  return children
}
