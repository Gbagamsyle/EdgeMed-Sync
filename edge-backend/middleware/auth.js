import jwt from 'jsonwebtoken'
import axios from 'axios'
import { getSupabase } from '../services/supabaseClient.js'

/**
 * Middleware to require a valid JWT with staff role.
 * Accepts either a server-signed JWT (JWT_SECRET) or a Supabase access token.
 */
export const requireStaff = async (req, res, next) => {
  try {
    const auth = req.headers.authorization || req.headers.Authorization
    if (!auth) return res.status(401).json({ error: 'Authorization header required' })

    const parts = auth.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ error: 'Invalid authorization format' })
    }

    const token = parts[1]

    // Try server-signed JWT first
    try {
      const secret = process.env.JWT_SECRET
      if (secret) {
        const payload = jwt.verify(token, secret)
        if (payload.role === 'staff' || payload.is_staff === true) {
          req.user = payload
          return next()
        }
      }
    } catch (e) {
      // ignore and fallback to Supabase token check
    }

    // Fallback: attempt to validate Supabase access token
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
    if (!supabaseUrl || !apiKey) {
      return res.status(500).json({ error: 'Supabase config missing on server' })
    }

    // Call Supabase auth endpoint to get user from token
    const userResp = await axios.get(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: apiKey
      }
    })

    const user = userResp.data
    if (!user || !user.id) {
      return res.status(401).json({ error: 'Invalid Supabase token' })
    }

    // Query users table for role/is_staff using service role client
    const supabase = getSupabase()
    if (!supabase) return res.status(500).json({ error: 'Supabase not initialized' })

    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error || !profile) {
      return res.status(403).json({ error: 'User profile not found or access denied' })
    }

    if (profile.role === 'staff' || profile.is_staff === true) {
      req.user = { id: user.id, profile }
      return next()
    }

    return res.status(403).json({ error: 'Staff access required' })
  } catch (err) {
    console.error('[AUTH] Verification failed:', err?.message || err)
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export default requireStaff
