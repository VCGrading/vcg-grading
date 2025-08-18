import Stripe from 'stripe'
import { supaService } from '../_db.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { email, plan, cards, address, promoCode } = req.body || {}
    if (!email || !plan || !Array.isArray(cards) || cards.length === 0) {
      return res.status(400).json({ error: 'Bad payload' })
    }

    const base = { Standard: 4900, Express: 7900, Ultra: 12900 } // en cents
    const subtotal = (base[plan] || 0) * cards.length
    const promo = promoCode === 'WELCOME10' ? Math.round(subtotal * 0.10) : 0
    const total = Math.max(0, subtotal - promo)

    const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`

    await supaService.from('orders').insert({
      id: orderId,
      user_email: email,
      status: 'créée',
      total_cents: total,
      items: cards.length,
      return_address: address ?? null,
    })

    await supaService.from('order_items').insert(
      cards.map((c) => ({
        order_id: orderId,
        game: c.game,
        name: c.name,
        set: c.set,
        number: c.number,
        year: c.year ? Number(c.year) : null,
        declared_value_cents: c.declared ? Math.round(Number(c.declared) * 100) : null,
        notes: c.notes || null,
      }))
    )

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: total,
          product_data: { name: `VCG ${plan} × ${cards.length} carte(s)` }
        }
      }],
      success_url: `${process.env.SITE_URL}/account?order=${orderId}`,
      cancel_url: `${process.env.SITE_URL}/order/new?canceled=1`,
      metadata: { orderId },
    })

    res.status(200).json({ checkoutUrl: session.url, orderId })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
}
