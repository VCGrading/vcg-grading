// api/admin/orders.mjs   -> GET /api/admin/orders
import { supaService } from '../_db.mjs'
import { checkAdmin } from './_auth.js'

export default async function handler(req, res) {
  const guard = await checkAdmin(req)
  if (!guard.ok) return res.status(guard.status).json({ error: guard.error })

  try {
    // 1) Récupère les commandes (les 500 plus récentes)
    const { data: orders, error } = await supaService
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) throw error

    const ids = (orders || []).map(o => o.id)
    let itemsByOrder = {}
    if (ids.length) {
      const { data: items, error: e2 } = await supaService
        .from('order_items')
        .select('*')
        .in('order_id', ids)

      if (e2) throw e2
      for (const it of items) {
        if (!itemsByOrder[it.order_id]) itemsByOrder[it.order_id] = []
        itemsByOrder[it.order_id].push(it)
      }
    }

    const out = (orders || []).map(o => ({
      ...o,
      order_items: itemsByOrder[o.id] || []
    }))

    return res.status(200).json({ orders: out })
  } catch (e) {
    console.error('admin/orders error', e)
    return res.status(500).json({ error: 'SERVER_ERROR', message: String(e?.message || e) })
  }
}
