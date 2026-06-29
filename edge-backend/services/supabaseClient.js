import { createClient } from '@supabase/supabase-js'

let supabaseInstance = null

export const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  // Prefer service role key on server for privileged operations
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env')
    return null
  }

  supabaseInstance = createClient(supabaseUrl, supabaseKey)
  console.log('✅ Supabase client initialized')
  return supabaseInstance
}

// For backward compatibility
export const supabase = getSupabase()
