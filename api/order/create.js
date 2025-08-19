// api/order/create.js
import Stripe from 'stripe'

// Stripe SDK (Node 18+ sur Vercel)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
})

export default async function handler(req, res) {
  const fail = (code, msg, extra = {}) => res.status(code).json({ error: msg, ...extra })

  if (req.method !== 'POST') return fail(405, 'Method not allowed')

  // sécurise le parsing du body
  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = {} }
  }
  body = body || {}

  const { email, plan, cards, promoCode } = body
  if (!email || !plan || !Array.isArray(cards) || cards.length === 0) {
    return fail(400, 'Bad payload', { debug: { email, plan, cardsLen: Array.isArray(cards) ? cards.length : null } })
  }

  // tarifs en CENTIMES (à ajuster)
  const base = { Standard: 1199, Express: 2999, Ultra: 8999 } // 11,99€ / 29,99€ / 89,99€
  if (!base[plan]) return fail(400, 'Unknown plan')

  try {
    const subtotal = base[plan] * cards.length

    // éventuel code promo (ex : WELCOME10 / VCG5)
    const PROMOS = { WELCOME10: 10, VCG5: 5 }
    let discounts = undefined
    const pct = PROMOS[String(promoCode || '').toUpperCase()]
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
          unit_amount: subtotal, // total en centimes
          product_data: { name: `VCG ${plan} × ${cards.length} carte(s)` },
        },
      }],
      discounts,
      success_url: `${site}/account?paid=1`,   // tu peux changer la redirection de succès
      cancel_url: `${site}/order/new?canceled=1`,
    })

    return res.status(200).json({ checkoutUrl: session.url })
  } catch (err) {
    console.error('stripe checkout error:', err)
    return fail(500, 'SERVER_ERROR', { message: String(err) })
  }
}
