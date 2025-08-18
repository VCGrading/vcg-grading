import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const anon = process.env.SUPABASE_ANON_KEY
const service = process.env.SUPABASE_SERVICE_ROLE

if (!url || !anon || !service) {
  throw new Error('Missing Supabase env vars (SUPABASE_URL/ANON_KEY/SERVICE_ROLE)')
}

export const supaClient = createClient(url, anon)
export const supaService = createClient(url, service) // privilèges serveur (RLS bypass)
