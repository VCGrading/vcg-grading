// api/orders.mjs   -> GET /api/orders
import { supaService, supaAnon } from './_db.mjs'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // 1) Email via Bearer (prioritaire)
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

    // 2) Fallback pour tests: ?email=
    if (!email) email = req.query.email || null
    if (!email) return res.status(401).json({ error: 'UNAUTHENTICATED' })

    const emailNorm = String(email).trim().toLowerCase()

    // Helper: construit la requête avec/ sans les non-payées
    const buildQuery = (includeUnpaid) => {
      let q = supaService
        .from('orders')
        .select('*')
        .ilike('user_email', emailNorm) // insensible à la casse
        .order('created_at', { ascending: false })
        .limit(200)

      if (!includeUnpaid) q = q.neq('status', 'en attente paiement')
      return q
    }

    // 1er essai: commandes payées (par défaut)
    let { data: orders, error } = await buildQuery(false)
    if (error) throw error

    // Si rien trouvé, on fait un fallback en incluant les non-payées.
    if (!orders || orders.length === 0) {
      const { data: alsoUnpaid, error: e2 } = await buildQuery(true)
      if (e2) throw e2
      orders = alsoUnpaid || []
    }

    return res.status(200).json({ orders })
  } catch (e) {
    console.error('orders list error', e)
    return res.status(500).json({ error: 'SERVER_ERROR', message: String(e?.message || e) })
  }
}
