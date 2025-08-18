import Stripe from 'stripe'
import { supaService } from '../_db.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const sig = req.headers['stripe-signature']
    const raw = await getRawBody(req)
    const event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const orderId = session?.metadata?.orderId
      if (orderId) {
        await supaService.from('orders').update({ status: 'réceptionnée' }).eq('id', orderId)
      }
    }
    res.json({ received: true })
  } catch (err) {
    console.error(err)
    res.status(400).send(`Webhook Error: ${err.message}`)
  }
}

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}
