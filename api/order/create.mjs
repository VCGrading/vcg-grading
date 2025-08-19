// api/order/create.mjs
import { supaService } from '../_db.mjs'

const TIERS = [
  { min: 0,    discount: 0 },
  { min: 100,  discount: 2 },
  { min: 250,  discount: 4 },
  { min: 500,  discount: 6 },
  { min: 1000, discount: 8 },
  { min: 2000, discount: 12 },
]

function discountForSpend(euros) {
  let pct = 0
  for (const t of TIERS) if (euros >= t.min) pct = t.discount
  return pct
}

export default async function handler(req, res) {
  const fail = (code, error, extra = {}) => res.status(code).json({ error, ...extra })
  if (req.method !== 'POST') return fail(405, 'Method not allowed')

  const envOk = {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE: !!process.env.SUPABASE_SERVICE_ROLE,
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
  }
  if (!envOk.SUPABASE_URL || !envOk.SUPABASE_SERVICE_ROLE) {
    return fail(501, 'SUPABASE_NOT_CONFIGURED', { envOk })
  }

  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }
  body = body || {}
  const { email, plan, cards, promoCode, address } = body
  if (!email || !plan || !Array.isArray(cards) || cards.length === 0) {
    return fail(400, 'Bad payload', { debug: { hasEmail: !!email, plan, cardsLen: Array.isArray(cards) ? cards.length : null } })
  }

  const base = { Standard: 1199, Express: 2999, Ultra: 8999 }
  if (!base[plan]) return fail(400, 'Unknown plan', { plan })
  const subtotal = base[plan] * cards.length // en centimes

  // 🔎 cumul réel utilisateur pour appliquer le bon palier
  let userSpendEuros = 0
  try {
    const { data: prev, error: sumErr } = await supaService
      .from('orders')
      .select('total_cents, status')
      .eq('user_email', email)

    if (sumErr) throw sumErr
    userSpendEuros = Math.max(0, (prev || []).reduce((s, o) => s + (o.total_cents || 0), 0) / 100)
  } catch (e) {
    // en cas d’erreur de lecture, on applique 0% (palier bois)
    userSpendEuros = 0
  }

  const tierPct = discountForSpend(userSpendEuros)
  const PROMOS = { WELCOME10: 10, VCG5: 5 }
  const couponPct = PROMOS[String(promoCode || '').toUpperCase()] || 0

  const tierDiscountCents = Math.floor(subtotal * (tierPct / 100))
  const couponDiscountCents = Math.floor(subtotal * (couponPct / 100))
  const total_cents = Math.max(0, subtotal - tierDiscountCents - couponDiscountCents)

  const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`
  try {
    // 1) upsert user
    const { error: userErr } = await supaService
      .from('users')
      .upsert({ email }, { onConflict: 'email' })
    if (userErr) return fail(500, 'DB_UPSERT_USER', { details: userErr.message })

    // 2) insert order
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

    // 3) insert items
    const rows = cards.map(c => ({
      order_id: orderId,
      game: c.game ?? null,
      name: c.name ?? null,
      set: c.set ?? null,
      number: c.number ?? null,
      year: c.year ? Number(c.year) : null,
      declared_value_cents: c.declared ? Math.round(Number(c.declared) * 100) : null,
      notes: c.notes ?? null,
    }))
    const { error: itemsErr } = await supaService.from('order_items').insert(rows)
    if (itemsErr) return fail(500, 'DB_INSERT_ITEMS', { details: itemsErr.message })

    const site = process.env.SITE_URL || `https://${req.headers.host}`
    const secret = process.env.STRIPE_SECRET_KEY

    if (!secret) {
      const checkoutUrl = `${site}/account?order=${orderId}&mock=1`
      return res.status(200).json({ checkoutUrl, orderId, mode: 'mock' })
    }

    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(secret, { apiVersion: '2024-06-20' })

    let discounts
    if (couponPct > 0) {
      const coupon = await stripe.coupons.create({ percent_off: couponPct, duration: 'once' })
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
    return fail(500, 'SERVER_ERROR', { message: String(e?.message || e) })
  }
}
