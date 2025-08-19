// api/order/create.mjs
import { supaService } from '../_db.mjs'

export default async function handler(req, res) {
  const fail = (code, error, extra = {}) =>
    res.status(code).json({ error, ...extra })

  if (req.method !== 'POST') return fail(405, 'Method not allowed')

  // ---- Sanity check ENV (sans exposer les secrets)
  const envOk = {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE: !!process.env.SUPABASE_SERVICE_ROLE,
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY, // optionnel
  }
  if (!envOk.SUPABASE_URL || !envOk.SUPABASE_SERVICE_ROLE) {
    return fail(501, 'SUPABASE_NOT_CONFIGURED', { envOk })
  }

  // ---- Parse body robuste
  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }
  body = body || {}

  const { email, plan, cards, promoCode, address } = body
  if (!email || !plan || !Array.isArray(cards) || cards.length === 0) {
    return fail(400, 'Bad payload', { debug: { email, plan, cardsLen: Array.isArray(cards) ? cards.length : null } })
  }

  // ---- Pricing (centimes)
  const base = { Standard: 1199, Express: 2999, Ultra: 8999 }
  if (!base[plan]) return fail(400, 'Unknown plan', { plan })
  const subtotal = base[plan] * cards.length

  // ---- Crée l'ID
  const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`
  const total_cents = subtotal

  try {
    // 1) Upsert user
    const { error: userErr } = await supaService.from('users').upsert({ email })
    if (userErr) return fail(500, 'DB_UPSERT_USER', { details: userErr.message })

    // 2) Insert order
    const { error: orderErr } = await supaService.from('orders').insert({
      id: orderId,
      user_email: email,
      plan,
      status: 'créée',
      items: cards.length,
      total_cents,
      promo_code: promoCode || null,
      return_address: address || null,
    })
    if (orderErr) return fail(500, 'DB_INSERT_ORDER', { details: orderErr.message })

    // 3) Insert items
    const rows = cards.map(c => ({
      order_id: orderId,
      game: c.game ?? null,
      name: c.name ?? null,
      set: c.set ?? null,
      number: c.number ?? null,
      year: c.year ?? null,
      declared_value_cents: c.declared_value_cents ?? null,
      notes: c.notes ?? null,
    }))
    const { error: itemsErr } = await supaService.from('order_items').insert(rows)
    if (itemsErr) return fail(500, 'DB_INSERT_ITEMS', { details: itemsErr.message })

    // 4) Stripe (facultatif)
    const site = process.env.SITE_URL || `https://${req.headers.host}`
    const secret = process.env.STRIPE_SECRET_KEY

    if (!secret) {
      // Pas de Stripe -> on renvoie quand même une URL de retour pour continuer le test
      const checkoutUrl = `${site}/account?order=${orderId}&mock=1`
      return res.status(200).json({ checkoutUrl, orderId, mode: 'mock' })
    }

    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(secret, { apiVersion: '2024-06-20' })

    // code promo simple (optionnel)
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
    // On renvoie maintenant le message précis au client
    return fail(500, 'SERVER_ERROR', { message: String(e?.message || e) })
  }
}
