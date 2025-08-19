import { supaService } from '../_db.mjs'
import { buildPackingSlip, buildShippingLabel } from '../_pdf.mjs'
import { sendOrderDocsEmail } from '../_mail.mjs'

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    const { id, email } = req.body || {}
    if (!id) return res.status(400).json({ error: 'Missing id' })

    const { data: order, error } = await supaService
      .from('orders').select('*, order_items(*)').eq('id', id).single()
    if (error || !order) throw error || new Error('Order not found')

    const packingPDF = await buildPackingSlip(order)
    const labelPDF   = await buildShippingLabel(order)

    const to = email || order.user_email
    await sendOrderDocsEmail({ to, cc: process.env.DOCS_CC_EMAIL || null, order, packingPDF, labelPDF })

    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'SERVER_ERROR', message: String(e?.message || e) })
  }
}
