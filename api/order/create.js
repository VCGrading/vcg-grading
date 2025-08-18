import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, plan, cards } = (req.body ?? {}) as any
    if (!email || !plan || !Array.isArray(cards) || cards.length === 0) {
      return res.status(400).json({ error: 'Bad payload' })
    }

    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`
    const checkoutUrl = `/account?order=${orderId}&mock=1` // redirige vers compte (mock)

    return res.status(200).json({ checkoutUrl, orderId })
  } catch (err: any) {
    console.error('order/create error:', err)
    return res.status(500).json({ error: err?.message || 'Server error' })
  }
}
