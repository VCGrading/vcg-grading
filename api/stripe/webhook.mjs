// api/stripe/webhook.mjs
import { supaService } from '../_db.mjs'
export const config = { api: { bodyParser: false } }

export default async function handler(req, res) {
  const secret = process.env.STRIPE_SECRET_KEY
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret || !whSecret) return res.status(501).json({ error: 'Stripe webhook not configured' })

  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks)

  try {
    const { default: Stripe } = await import('stripe')
    const stripe = new Stripe(secret, { apiVersion: '2024-06-20' })
    const sig = req.headers['stripe-signature']
    const event = stripe.webhooks.constructEvent(raw, sig, whSecret)

    const mark = async (orderId, status) => {
      if (!orderId) return
      await supaService.from('orders').update({ status }).eq('id', orderId)
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const orderId = session?.metadata?.orderId
        await mark(orderId, 'créée')
        break
      }
      case 'checkout.session.expired':
      case 'checkout.session.async_payment_failed':
      case 'payment_intent.payment_failed': {
        const data = event.data.object
        const orderId =
          data?.metadata?.orderId ||
          data?.checkout_session?.metadata?.orderId ||
          data?.id // fallback
        await mark(orderId, 'annulée')
        break
      }
      default:
        break
    }

    return res.json({ received: true })
  } catch (e) {
    console.error('webhook error', e)
    return res.status(400).json({ error: 'Bad webhook', message: String(e?.message || e) })
  }
}
