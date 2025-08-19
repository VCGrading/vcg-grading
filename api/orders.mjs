// api/orders.mjs   -> GET /api/orders
import { supaService, supaAnon } from './_db.mjs'

export default async function handler(req, res) {
  try {
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return res.status(401).json({ error: 'UNAUTHENTICATED' })

    const { data, error: uerr } = await supaAnon.auth.getUser(token)
    if (uerr || !data?.user?.email) return res.status(401).json({ error: 'INVALID_TOKEN' })
    const email = data.user.email

    const { data: orders, error } = await supaService
      .from('orders')
      .select('*')
      .eq('user_email', email)
      .neq('status', 'en attente paiement') // on cache les non-payées
      .order('created_at', { ascending: false })

    if (error) throw error
    return res.status(200).json({ orders })
  } catch (e) {
    console.error('orders list error', e)
    return res.status(500).json({ error: 'SERVER_ERROR', message: String(e) })
  }
}
