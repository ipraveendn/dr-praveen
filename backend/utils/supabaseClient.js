import { createClient } from '@supabase/supabase-js'

let supabase = null

/**
 * Returns a singleton Supabase client using backend-only credentials.
 * Never expose SUPABASE_SERVICE_ROLE_KEY to the frontend.
 */
export function getSupabaseClient() {
  const url = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    return null
  }

  if (!supabase) {
    supabase = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  return supabase
}

export default getSupabaseClient
