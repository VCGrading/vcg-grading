// api/orders.mjs   -> GET /api/orders
import { supaService, supaAnon } from './_db.mjs'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    let email = req.query.email || null

    // 1) Essayer via Bearer token (Supabase)
    const auth = req.headers.authorization || ''
    if (auth.startsWith('Bearer ')) {
      const token = auth.slice(7)
      try {
        const { data, error } = await supaAnon.auth.getUser(token)
        if (!error && data?.user?.email) email = data.user.email
      } catch (e) {
        console.log('[orders] getUser failed:', e?.message || e)
      }
    }

    // 2) Fallback requis: ?email=
    if (!email) {
      return res.status(401).json({ error: 'UNAUTHENTICATED' })
    }

    let query = supaService.from('orders').select('*').eq('user_email', email)

    // Par défaut on cache les commandes non payées
    const includeUnpaid = req.query.include_unpaid === '1'
    if (!includeUnpaid) query = query.neq('status', 'en attente paiement')

    query = query.order('created_at', { ascending: false })

    const { data: orders, error } = await query
    if (error) throw error

    return res.status(200).json({ orders: orders || [] })
  } catch (e) {
    console.error('orders list error', e)
    return res.status(500).json({ error: 'SERVER_ERROR', message: String(e?.message || e) })
  }
}
