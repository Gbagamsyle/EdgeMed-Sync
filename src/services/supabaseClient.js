import { createClient } from "@supabase/supabase-js"

const runtimeEnv = typeof import.meta !== 'undefined' && import.meta.env
  ? import.meta.env
  : (typeof globalThis !== 'undefined' && globalThis.process?.env ? globalThis.process.env : {})

const supabaseUrl = runtimeEnv.VITE_SUPABASE_URL
const supabaseKey = runtimeEnv.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)