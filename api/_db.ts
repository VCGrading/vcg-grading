import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL!
const anon = process.env.SUPABASE_ANON_KEY!
const service = process.env.SUPABASE_SERVICE_ROLE!  // pour les requêtes serveur

export const supaClient = createClient(url, anon)
export const supaService = createClient(url, service) // pour insert/updates depuis les fonctions
