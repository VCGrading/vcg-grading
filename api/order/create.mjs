// api/order/create.mjs
export default async function handler(req, res) {
  const fail = (code, msg, extra = {}) => res.status(code).json({ error: msg, ...extra })

  if (req.method !== 'POST') return fail(405, 'Method not allowed')

  // parse du body robuste
  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = {} }
  }
  body = body || {}
  const { email, plan, cards, promoCode } = body

  if (!email || !plan || !Array.isArray(cards) || cards.length === 0) {
    return fail(400, 'Bad payload', { debug: { hasEmail: !!email, plan, cardsLen: Array.isArray(cards) ? cards.length : null } })
  }

  // URL de base (utile après paiement)
  const site = process.env.SITE_URL || `https://${req.headers.host}`

  // Si la clé Stripe n’est pas définie → on ne crashe pas, on renvoie une redirection "mock"
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) {
    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`
    return res.status(200).json({ checkoutUrl: `${site}/account?order=${orderId}&mock=1`, orderId, mode: 'mock' })
  }

  // Import Stripe au runtime (évite les crashes ESM/CJS)
  let Stripe
  try {
    Stripe = (await import('stripe')).default
  } catch (e) {
    return fail(500, 'Stripe SDK load failed', { message: String(e) })
  }
  const stripe = new Stripe(secret, { apiVersion: '2024-06-20' })

  // Tarifs en centimes
  const base = { Standard: 1199, Express: 2999, Ultra: 8999 }
  if (!base[plan]) return fail(400, 'Unknown plan')
  const subtotal = base[plan] * cards.length

  // Code promo simple (ex. WELCOME10 / VCG5)
  const PROMOS = { WELCOME10: 10, VCG5: 5 }
  const pct = PROMOS[String(promoCode || '').toUpperCase()]
  let discounts
  if (pct) {
    const coupon = await stripe.coupons.create({ percent_off: pct, duration: 'once' })
    discounts = [{ coupon: coupon.id }]
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: subtotal,
          product_data: { name: `VCG ${plan} × ${cards.length} carte(s)` },
        },
      }],
      discounts,
      success_url: `${site}/account?paid=1`,
      cancel_url: `${site}/order/new?canceled=1`,
    })
    return res.status(200).json({ checkoutUrl: session.url })
  } catch (err) {
    return fail(500, 'SERVER_ERROR', { message: String(err?.raw?.message || err) })
  }
}
