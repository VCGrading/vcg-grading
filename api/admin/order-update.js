// api/admin/order-update.mjs   -> POST { id, status?, tracking? }
import { supaService } from '../_db.mjs'
import { checkAdmin } from './_auth.js'

const ALLOWED = ['créée', 'payée', 'réceptionnée', 'en évaluation', 'évaluée', 'expédiée']

export default async function handler(req, res) {
  const guard = await checkAdmin(req)
  if (!guard.ok) return res.status(guard.status).json({ error: guard.error })

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }
  const { id, status, tracking } = body || {}
  if (!id) return res.status(400).json({ error: 'Missing id' })

  const patch = {}
  if (typeof status === 'string') {
    if (!ALLOWED.includes(status)) {
      return res.status(400).json({ error: 'Bad status', allowed: ALLOWED })
    }
    patch.status = status
  }
  if (typeof tracking !== 'undefined') {
    patch.tracking = tracking === '' ? null : String(tracking)
  }
  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ error: 'Nothing to update' })
  }

  try {
    const { data, error } = await supaService
      .from('orders')
      .update(patch)
      .eq('id', id)
      .select('*')
      .limit(1)
    if (error) throw error
    return res.status(200).json({ order: data?.[0] || null })
  } catch (e) {
    console.error('admin/order-update error', e)
    return res.status(500).json({ error: 'SERVER_ERROR', message: String(e?.message || e) })
  }
}
