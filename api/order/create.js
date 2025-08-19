// api/order/create.js
const Stripe = require('stripe')

// Helper pour répondre toujours en JSON
const jsonFail = (res, code, msg, extra = {}) => res.status(code).json({ error: msg, ...extra })

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return jsonFail(res, 405, 'Method not allowed')

  // Si la clé Stripe est absente, on renvoie un message clair (et on n’essaie PAS d’importer Stripe)
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) return jsonFail(res, 501, 'Stripe not configured: set STRIPE_SECRET_KEY on Vercel')

  // Stripe SDK (CommonJS)
  let stripe
  try {
    stripe = new Stripe(secret, { apiVersion: '2024-06-20' })
  } catch (e) {
    console.error('Stripe init error:', e)
    return jsonFail(res, 500, 'Stripe init failed', { message: String(e) })
  }

  // Parse body de manière robuste (parfois string, parfois objet)
  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = {} }
  }
  body = body || {}

  const { email, plan, cards, promoCode } = body
  if (!email || !plan || !Array.isArray(cards) || cards.length === 0) {
    return jsonFail(res, 400, 'Bad payload', {
      debug: { hasEmail: !!email, plan, cardsLen: Array.isArray(cards) ? cards.length : null }
    })
  }

  // Tarifs (centimes)
  const base = { Standard: 1199, Express: 2999, Ultra: 8999 }
  if (!base[plan]) return jsonFail(res, 400, 'Unknown plan')

  try {
    const subtotal = base[plan] * cards.length

    // Code promo simple (test)
    const PROMOS = { WELCOME10: 10, VCG5: 5 }
    const pct = PROMOS[String(promoCode || '').toUpperCase()]
    let discounts
    if (pct) {
      const coupon = await stripe.coupons.create({ percent_off: pct, duration: 'once' })
      discounts = [{ coupon: coupon.id }]
    }

    const site = process.env.SITE_URL || `https://${req.headers.host}`

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: subtotal,
          product_data: { name: `VCG ${plan} × ${cards.length} carte(s)` }
        }
      }],
      discounts,
      success_url: `${site}/account?paid=1`,
      cancel_url: `${site}/order/new?canceled=1`,
    })

    return res.status(200).json({ checkoutUrl: session.url })
  } catch (err) {
    console.error('checkout error:', err)
    return jsonFail(res, 500, 'SERVER_ERROR', { message: String(err && err.raw ? err.raw.message : err) })
  }
}
