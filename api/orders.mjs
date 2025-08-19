// api/orders.mjs   -> GET /api/orders
import { supaService, supaAnon } from './_db.mjs'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // 1) Email depuis Bearer (prioritaire)
    let email = null
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

    // 2) Fallback : ?email= (utile pour tests)
    if (!email) email = req.query.email || null
    if (!email) return res.status(401).json({ error: 'UNAUTHENTICATED' })

    const emailNorm = String(email).trim().toLowerCase()

    let query = supaService
      .from('orders')
      .select('*')
      .eq('user_email', emailNorm)

    // Par défaut, on masque les commandes non payées
    const includeUnpaid = req.query.include_unpaid === '1'
    if (!includeUnpaid) {
      query = query.neq('status', 'en attente paiement')
    }

    query = query.order('created_at', { ascending: false })

    const { data: orders, error } = await query
    if (error) throw error

    return res.status(200).json({ orders: orders || [] })
  } catch (e) {
    console.error('orders list error', e)
    return res.status(500).json({ error: 'SERVER_ERROR', message: String(e) })
  }
}
