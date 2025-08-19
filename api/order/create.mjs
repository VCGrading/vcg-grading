// api/order/create.mjs
import { supaService } from '../_db.mjs'

export default async function handler(req, res) {
  const fail = (c, m, extra = {}) => res.status(c).json({ error: m, ...extra })
  if (req.method !== 'POST') return fail(405, 'Method not allowed')

  // parse body robuste
  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }
  body = body || {}
  const { email, plan, cards, promoCode, address } = body
  if (!email || !plan || !Array.isArray(cards) || !cards.length) return fail(400, 'Bad payload')

  // pricing (centimes)
  const base = { Standard: 1199, Express: 2999, Ultra: 8999 }
  if (!base[plan]) return fail(400, 'Unknown plan')
  const subtotal = base[plan] * cards.length

  // crée ID commande
  const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`
  const total_cents = subtotal // (on ignore les remises côté Stripe pour l’instant)

  try {
    // 1) upsert user (par email)
    await supaService.from('users').upsert({ email }).select()

    // 2) insert order
    const { error: e1 } = await supaService.from('orders').insert({
      id: orderId,
      user_email: email,
      plan,
      status: 'créée',
      items: cards.length,
      total_cents,
      promo_code: promoCode || null,
      return_address: address || null,
    })
    if (e1) throw e1

    // 3) insert items
    const rows = cards.map(c => ({
      order_id: orderId,
      game: c.game, name: c.name, set: c.set, number: c.number,
      year: c.year ?? null,
      declared_value_cents: c.declared_value_cents ?? null,
      notes: c.notes ?? null,
    }))
    const { error: e2 } = await supaService.from('order_items').insert(rows)
    if (e2) throw e2

    // 4) Stripe (si clé présente) sinon mock vers /account
    const site = process.env.SITE_URL || `https://${req.headers.host}`
    const secret = process.env.STRIPE_SECRET_KEY

    if (!secret) {
      const checkoutUrl = `${site}/account?order=${orderId}&mock=1`
      return res.status(200).json({ checkoutUrl, orderId, mode: 'mock' })
    }

    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(secret, { apiVersion: '2024-06-20' })

    // gestion simple du code promo (création d’un coupon ponctuel)
    let discounts
    const PROMOS = { WELCOME10: 10, VCG5: 5 }
    const pct = PROMOS[String(promoCode || '').toUpperCase()]
    if (pct) {
      const coupon = await stripe.coupons.create({ percent_off: pct, duration: 'once' })
      discounts = [{ coupon: coupon.id }]
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: total_cents,
          product_data: { name: `VCG ${plan} × ${cards.length} carte(s)` },
        },
      }],
      discounts,
      success_url: `${site}/account?order=${orderId}&paid=1`,
      cancel_url: `${site}/order/new?canceled=1`,
      metadata: { orderId },
    })

    return res.status(200).json({ checkoutUrl: session.url, orderId })
  } catch (e) {
    console.error('order/create error', e)
    return fail(500, 'SERVER_ERROR', { message: String(e?.message || e) })
  }
}
