export default async function handler(req, res) {
  // Toujours répondre en JSON
  const fail = (code, msg, extra = {}) => res.status(code).json({ error: msg, ...extra })

  if (req.method !== 'POST') return fail(405, 'Method not allowed')

  try {
    // Sécurise le body (parfois req.body est string, parfois objet)
    let body = req.body
    if (typeof body === 'string') {
      try { body = JSON.parse(body) } catch { /* ignore, on traitera undefined */ }
    }
    body = body || {}

    const { email, plan, cards } = body
    if (!email || !plan || !Array.isArray(cards) || cards.length === 0) {
      return fail(400, 'Bad payload', { debug: { email, plan, cardsType: typeof cards } })
    }

    // Mock : génère un ID et renvoie une URL de redirection vers la page compte
    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`
    const checkoutUrl = `/account?order=${orderId}&mock=1`

    return res.status(200).json({ checkoutUrl, orderId })
  } catch (err) {
    console.error('order/create error', err)
    return fail(500, 'SERVER_ERROR', { message: String(err) })
  }
}
