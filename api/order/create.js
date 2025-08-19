// api/order/create.js
export default async function handler(req, res) {
  // petite helper pour toujours renvoyer du JSON
  const fail = (code, msg, extra = {}) => res.status(code).json({ error: msg, ...extra })

  if (req.method !== 'POST') return fail(405, 'Method not allowed')

  try {
    // req.body peut être string ou objet selon l’environnement
    let body = req.body
    if (typeof body === 'string') {
      try { body = JSON.parse(body) } catch { body = {} }
    }
    body = body || {}

    const { email, plan, cards } = body
    if (!email || !plan || !Array.isArray(cards) || cards.length === 0) {
      return fail(400, 'Bad payload', { debug: { hasEmail: !!email, plan, cardsLen: Array.isArray(cards) ? cards.length : null } })
    }

    // ID commande mock
    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`

    // URL absolue (utile quand redirigé depuis Stripe plus tard)
    const site = process.env.SITE_URL || `https://${req.headers.host}`
    const checkoutUrl = `${site}/account?order=${orderId}&mock=1`

    return res.status(200).json({ checkoutUrl, orderId })
  } catch (err) {
    console.error('order/create error', err)
    return fail(500, 'SERVER_ERROR', { message: String(err) })
  }
}
