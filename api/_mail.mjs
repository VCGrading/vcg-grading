// api/_mail.mjs
import { Resend } from 'resend'

/**
 * Envoie au client les PDFs de commande via Resend.
 * - BCC "invisible" via DOCS_BCC_EMAILS (liste séparée par virgules)
 * - No-op si la config mail est absente (pas de crash)
 * - Fallback: si BCC non supporté, envoie une 2e copie interne
 */
export async function sendOrderDocsEmail({ to, order, packingPDF, labelPDF }) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.DOCS_FROM_EMAIL // ex: "VCG Grading <no-reply@vcg-grading.com>"
  const bccEnv = process.env.DOCS_BCC_EMAILS || '' // "ops@vcg.com,archive@vcg.com"
  const bccList = bccEnv
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  if (!apiKey || !from) {
    console.log('[mail] skip: RESEND_API_KEY ou DOCS_FROM_EMAIL manquant(s).')
    return { skipped: true }
  }
  if (!to) {
    console.log('[mail] skip: destinataire client manquant.')
    return { skipped: true }
  }

  const resend = new Resend(apiKey)

  const subject = `VCG — Confirmation commande ${order.id}`
  const html = `
    <div style="font-family:system-ui,Segoe UI,Helvetica,Arial">
      <h2>Merci pour votre commande ${order.id}</h2>
      <p>Nous avons bien reçu votre paiement. Retrouvez en pièces jointes&nbsp;:</p>
      <ul>
        <li>Bon de préparation</li>
        <li>Étiquette d’expédition</li>
      </ul>
      <p>Vous pouvez suivre l’avancement depuis votre espace compte.</p>
      <p style="color:#64748b;font-size:12px">Ce message a été envoyé automatiquement.</p>
    </div>
  `
  const attachments = [
    { filename: `bon-preparation-${order.id}.pdf`, content: packingPDF, contentType: 'application/pdf' },
    { filename: `etiquette-${order.id}.pdf`,      content: labelPDF,   contentType: 'application/pdf' },
  ]

  // 1) tentative avec BCC (si supporté)
  try {
    const resp = await resend.emails.send({
      from,
      to,
      ...(bccList.length ? { bcc: bccList } : {}),
      subject,
      html,
      attachments
    })
    return { ok: true, bcc: bccList, provider: 'resend', id: resp?.id }
  } catch (e) {
    // 2) fallback: envoi client puis copie interne séparée
    console.warn('[mail] BCC possiblement non supporté — fallback double envoi', e?.message || e)

    // Envoi client seul
    const respClient = await resend.emails.send({
      from,
      to,
      subject,
      html,
      attachments
    })

    // Copie interne invisible (e-mail séparé)
    if (bccList.length) {
      const internalHtml = `
        <div style="font-family:system-ui,Segoe UI,Helvetica,Arial">
          <h2>COPIE INTERNE — ${order.id}</h2>
          <p>Copie interne invisible au client. Même pièces jointes.</p>
        </div>
      `
      await resend.emails.send({
        from,
        to: bccList,
        subject: `[Interne] Copie docs ${order.id}`,
        html: internalHtml,
        attachments
      })
    }

    return { ok: true, fallback: true, clientId: respClient?.id }
  }
}
