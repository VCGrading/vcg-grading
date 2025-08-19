// api/stripe/webhook.mjs
import { supaService } from '../_db.mjs'
export const config = { api: { bodyParser: false } } // important: raw body

export default async function handler(req, res) {
  const secret = process.env.STRIPE_SECRET_KEY
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret || !whSecret) return res.status(501).json({ error: 'Stripe webhook not configured' })

  // lire le raw body
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks)

  try {
    const { default: Stripe } = await import('stripe')
    const stripe = new Stripe(secret, { apiVersion: '2024-06-20' })
    const sig = req.headers['stripe-signature']
    const event = stripe.webhooks.constructEvent(raw, sig, whSecret)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const orderId = session?.metadata?.orderId
      if (orderId) {
        await supaService.from('orders').update({ status: 'réceptionnée' }).eq('id', orderId)
      }
    }

    return res.json({ received: true })
  } catch (e) {
    console.error('webhook error', e)
    return res.status(400).json({ error: 'Bad webhook', message: String(e?.message || e) })
  }
}
