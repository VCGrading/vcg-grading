// api/stripe/webhook.mjs
import { supaService } from '../_db.mjs'
import { buildPackingSlip, buildShippingLabel } from '../_pdf.mjs'
import { sendOrderDocsEmail } from '../_mail.mjs'

export const config = { api: { bodyParser: false } }

export default async function handler(req, res) {
  const secret = process.env.STRIPE_SECRET_KEY
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret || !whSecret) return res.status(501).json({ error: 'Stripe webhook not configured' })

  // Lire raw body
  const chunks = []
  for await (const c of req) chunks.push(c)
  const raw = Buffer.concat(chunks)

  try {
    const { default: Stripe } = await import('stripe')
    const stripe = new Stripe(secret, { apiVersion: '2024-06-20' })
    const sig = req.headers['stripe-signature']
    const event = stripe.webhooks.constructEvent(raw, sig, whSecret)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const orderId = session?.metadata?.orderId
      const customerEmail = session?.customer_details?.email || session?.customer_email

      if (orderId) {
        // Récupérer la commande + items + adresse
        const { data: order, error } = await supaService
          .from('orders')
          .select('*, order_items(*)')
          .eq('id', orderId)
          .single()
        if (error || !order) throw error || new Error('Order not found')

        // Idempotence simple: si déjà payée, ne renvoie pas en boucle les mails
        const alreadyPaid = order.status === 'payée'
        if (!alreadyPaid) {
          await supaService.from('orders').update({ status: 'payée' }).eq('id', orderId)
        }

        // Générer PDFs
        const packingPDF = await buildPackingSlip(order)
        const labelPDF   = await buildShippingLabel(order)

        // Envoyer email (client + toi en CC)
        const cc = process.env.DOCS_CC_EMAIL || null
        const to = customerEmail || order.user_email
        try {
          if (to) {
            await sendOrderDocsEmail({ to, cc, order, packingPDF, labelPDF })
          }
        } catch (e) {
          console.error('email send error', e)
          // on n'échoue pas le webhook pour éviter les retries Stripe
        }
      }
    }

    return res.json({ received: true })
  } catch (e) {
    console.error('webhook error', e)
    return res.status(400).json({ error: 'Bad webhook', message: String(e?.message || e) })
  }
}
