// api/order.mjs
import { supaService } from './_db.mjs'

export default async function handler(req, res) {
  const id = req.query.id
  if (!id || Array.isArray(id)) return res.status(400).json({ error: 'Missing id' })

  try {
    // On récupère la commande + les items (relation order_items)
    const { data, error, status } = await supaService
      .from('orders')
      .select(`
        id, user_email, plan, status, items, total_cents, created_at, tracking, return_address,
        order_items:order_items(*)
      `)
      .eq('id', id)
      .single()

    if (error && status !== 406) throw error
    if (!data) return res.status(404).json({ error: 'Not found' })

    return res.status(200).json({
      order: {
        id: data.id,
        user_email: data.user_email,
        plan: data.plan,
        status: data.status,
        items: data.items,
        total_cents: data.total_cents,
        created_at: data.created_at,
        tracking: data.tracking,
        return_address: data.return_address || null
      },
      items: data.order_items || []
    })
  } catch (e) {
    console.error('order get error', e)
    return res.status(500).json({ error: 'SERVER_ERROR', message: String(e) })
  }
}
