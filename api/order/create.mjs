// api/order/create.mjs
import { supaService, supaAnon } from '../_db.mjs'

// --- Config pricing & promos ---
const TIERS = [
  { min: 0,    discount: 0 },
  { min: 100,  discount: 2 },
  { min: 250,  discount: 4 },
  { min: 500,  discount: 6 },
  { min: 1000, discount: 8 },
  { min: 2000, discount: 12 },
]
const PROMOS = { WELCOME10: 10, VCG5: 5 }
const base = { Standard: 1199, Express: 2999, Ultra: 8999 } // centimes
const isCardValid = (c) => !!c && String(c.name || '').trim().length >= 2
const discountForSpend = (euros) =>
  TIERS.reduce((acc, t) => (euros >= t.min ? t.discount : acc), 0)

export default async function handler(req, res) {
  const fail = (c, m, extra = {}) => res.status(c).json({ error: m, ...extra })
  if (req.method !== 'POST') return fail(405, 'Method not allowed')

  // --- Auth obligatoire (via Supabase) ---
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return fail(401, 'UNAUTHENTICATED')

  const { data, error: uerr } = await supaAnon.auth.getUser(token)
  if (uerr || !data?.user?.email) return fail(401, 'INVALID_TOKEN')

  // Email du compte, normalisé (clé de liaison des commandes)
  const accountEmail = String(data.user.email).trim().toLowerCase()

  // --- Parse payload ---
  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }
  body = body || {}

  const { plan, cards, promoCode, address } = body
  if (!plan || !Array.isArray(cards)) return fail(400, 'Bad payload')

  const validCards = cards.filter(isCardValid)
  if (!validCards.length) return fail(400, 'NO_VALID_CARDS')

  if (!base[plan]) return fail(400, 'Unknown plan')

  // --- Pricing brut ---
  const subtotal = base[plan] * validCards.length

  // --- Cumul payé déjà existant (exclut “en attente paiement”) ---
  let userSpendEuros = 0
  try {
    const { data: prev } = await supaService
      .from('orders')
      .select('total_cents,status')
      .eq('user_email', accountEmail)
      .neq('status', 'en attente paiement')

    userSpendEuros = Math.max(
      0,
      ((prev || []).reduce((s, o) => s + (o.total_cents || 0), 0) / 100)
    )
  } catch {
    userSpendEuros = 0
  }

  // --- Remises palier + coupon (calcul côté serveur) ---
  const tierPct   = discountForSpend(userSpendEuros)
  const couponPct = PROMOS[String(promoCode || '').toUpperCase()] || 0

  // total centimes après remises
  const total_cents = Math.max(
    0,
    subtotal
      - Math.floor(subtotal * tierPct   / 100)
      - Math.floor(subtotal * couponPct / 100)
  )

  // --- Crée la commande ---
  const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`
  try {
    // Upsert user (email normalisé)
    await supaService.from('users').upsert(
      { email: accountEmail },
      { onConflict: 'email' }
    )

    // Insert order (status initial: en attente paiement)
    const { error: e1 } = await supaService.from('orders').insert({
      id: orderId,
      user_email: accountEmail,        // <- email de compte normalisé
      plan,
      status: 'en attente paiement',
      items: validCards.length,
      total_cents,
      promo_code: promoCode || null,
      return_address: address || null, // JSON adress de retour
    })
    if (e1) throw e1

    // Insert items
    const rows = validCards.map(c => ({
      order_id: orderId,
      game: c.game ?? null,
      name: c.name ?? null,
      set: c.set ?? null,
      number: c.number ?? null,
      year: c.year ? Number(c.year) : null,
      declared_value_cents: c.declared ? Math.round(Number(c.declared) * 100) : null,
      notes: c.notes ?? null,
    }))
    const { error: e2 } = await supaService.from('order_items').insert(rows)
    if (e2) throw e2

    // Stripe (mock si pas de clé)
    const site   = process.env.SITE_URL || `https://${req.headers.host}`
    const secret = process.env.STRIPE_SECRET_KEY

    if (!secret) {
      const checkoutUrl = `${site}/account?order=${orderId}&mock=1`
      return res.status(200).json({ checkoutUrl, orderId, mode: 'mock' })
    }

    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(secret, { apiVersion: '2024-06-20' })

    // Coupon Stripe (si coupon côté front)
    let discounts
    if (couponPct > 0) {
      const coupon = await stripe.coupons.create({ percent_off: couponPct, duration: 'once' })
      discounts = [{ coupon: coupon.id }]
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: accountEmail, // liaison paiement → compte
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: total_cents,
          product_data: { name: `VCG ${plan} × ${validCards.length} carte(s)` },
        },
      }],
      discounts,
      success_url: `${site}/account?order=${orderId}&paid=1`,
      cancel_url: `${site}/order/new?canceled=1`,
      metadata: { orderId, userEmail: accountEmail },
    })

    return res.status(200).json({ checkoutUrl: session.url, orderId })
  } catch (e) {
    console.error('order/create error', e)
    return fail(500, 'SERVER_ERROR', { message: String(e?.message || e) })
  }
}
