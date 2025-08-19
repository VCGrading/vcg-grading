// api/orders.mjs
import { supaService } from './_db.mjs'

export default async function handler(req, res) {
  const email = req.query.email
  if (!email) return res.status(400).json({ error: 'Missing email' })
  try {
    const { data: orders, error } = await supaService
      .from('orders')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false })
    if (error) throw error
    return res.status(200).json({ orders })
  } catch (e) {
    console.error('orders list error', e)
    return res.status(500).json({ error: 'SERVER_ERROR', message: String(e) })
  }
}
