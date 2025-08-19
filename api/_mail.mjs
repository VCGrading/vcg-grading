// api/_mail.mjs
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendOrderDocsEmail({ to, cc, order, packingPDF, labelPDF }) {
  const from = process.env.DOCS_FROM_EMAIL || 'no-reply@example.com'
  const subject = `VCG — Documents commande ${order.id}`
  const html = `
    <div style="font-family:Inter,system-ui,sans-serif">
      <h2>Merci pour votre commande ${order.id}</h2>
      <p>Vous trouverez en pièces jointes :</p>
      <ul>
        <li>Bon de préparation (PDF)</li>
        <li>Étiquette d’expédition 100×150 mm (PDF)</li>
      </ul>
      <p>Adresse retour : <b>${order.return_address?.firstName || ''} ${order.return_address?.lastName || ''}</b></p>
      <p>Besoin d’aide ? Répondez simplement à cet email.</p>
      <p>— L’équipe VCG</p>
    </div>
  `

  const attachments = [
    { filename: `VCG-${order.id}-bon-prepa.pdf`, content: packingPDF, contentType: 'application/pdf' },
    { filename: `VCG-${order.id}-etiquette.pdf`, content: labelPDF, contentType: 'application/pdf' }
  ]

  return await resend.emails.send({
    from,
    to,
    cc: cc ? [cc].filter(Boolean) : undefined,
    subject,
    html,
    attachments
  })
}
