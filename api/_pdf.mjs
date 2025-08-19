// api/_pdf.mjs
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import QRCode from 'qrcode'

const mm = v => v * 2.83465 // 1mm -> pt

export async function buildPackingSlip(order) {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([mm(210), mm(297)]) // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const draw = (text, x, y, size = 12, bold = false, color = rgb(0,0,0)) => {
    page.drawText(String(text), { x, y, size, font: bold ? fontBold : font, color })
  }

  // HEADER
  draw('VCG Grading — Bon de préparation', mm(15), mm(297-20), 16, true)
  draw(`Commande: ${order.id}`, mm(15), mm(297-32), 12, true)
  draw(`Client: ${order.user_email}`, mm(15), mm(297-42), 11)

  // QR Order ID
  const qr = await QRCode.toBuffer(order.id, { type: 'png', margin: 0, scale: 6 })
  const qrImg = await pdf.embedPng(qr)
  const qrSize = mm(28)
  page.drawImage(qrImg, { x: mm(210)-mm(20)-qrSize, y: mm(297-20)-qrSize, width: qrSize, height: qrSize })

  // Adresse client si dispo
  const a = order.return_address || {}
  let y = mm(297-65)
  draw('Adresse retour', mm(15), y, 12, true); y -= mm(6)
  draw(`${a.firstName || ''} ${a.lastName || ''}`, mm(15), y); y-=mm(5)
  if (a.company) { draw(a.company, mm(15), y); y-=mm(5) }
  if (a.line1)   { draw(a.line1,   mm(15), y); y-=mm(5) }
  if (a.line2)   { draw(a.line2,   mm(15), y); y-=mm(5) }
  if (a.postalCode || a.city) { draw(`${a.postalCode || ''} ${a.city || ''}`, mm(15), y); y-=mm(5) }
  if (a.country) { draw(a.country, mm(15), y); y-=mm(5) }

  // LISTE DES CARTES
  y -= mm(4)
  draw('Cartes', mm(15), y, 12, true); y-=mm(6)
  const items = order.order_items || []
  if (!items.length) {
    draw('— Aucune carte —', mm(15), y); 
  } else {
    draw('Jeu', mm(15), y, 10, true)
    draw('Nom / Set / N° / Année', mm(45), y, 10, true)
    draw('Déclaré', mm(170), y, 10, true); y-=mm(6)

    for (const it of items) {
      if (y < mm(20)) break
      draw(it.game || '-', mm(15), y)
      const line = [
        it.name || '-', 
        it.set ? `(${it.set}${it.number ? ` ${it.number}` : ''})` : '',
        it.year ? `, ${it.year}` : ''
      ].join(' ')
      draw(line, mm(45), y)
      const declared = typeof it.declared_value_cents === 'number' ? `${(it.declared_value_cents/100).toFixed(2)}€` : '-'
      draw(declared, mm(170), y)
      y -= mm(5)
    }
  }

  const bytes = await pdf.save()
  return Buffer.from(bytes)
}

export async function buildShippingLabel(order) {
  // 100x150mm label
  const width = mm(100), height = mm(150)
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([width, height])
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const draw = (text, x, y, size=10, b=false) =>
    page.drawText(String(text), { x, y, size, font: b ? bold : font })

  const FROM = {
    name:  process.env.SHIP_FROM_NAME || 'VCG Grading',
    l1:    process.env.SHIP_FROM_LINE1 || '',
    l2:    process.env.SHIP_FROM_LINE2 || '',
    city:  process.env.SHIP_FROM_CITY || '',
    pc:    process.env.SHIP_FROM_POSTAL || '',
    country: process.env.SHIP_FROM_COUNTRY || 'FR',
    phone: process.env.SHIP_FROM_PHONE || ''
  }
  const to = order.return_address || {}

  // Cadre
  page.drawRectangle({ x: mm(3), y: mm(3), width: width - mm(6), height: height - mm(6), borderColor: rgb(0,0,0), borderWidth: 1 })

  // Expéditeur
  let y = height - mm(8)
  draw('EXPÉDITEUR', mm(6), y, 8, true); y -= mm(5)
  draw(`${FROM.name}`, mm(6), y); y -= mm(4)
  if (FROM.l1) { draw(FROM.l1, mm(6), y); y-=mm(4) }
  if (FROM.l2) { draw(FROM.l2, mm(6), y); y-=mm(4) }
  draw(`${FROM.pc} ${FROM.city}`, mm(6), y); y-=mm(4)
  draw(`${FROM.country} ${FROM.phone ? '• ' + FROM.phone : ''}`, mm(6), y); y-=mm(6)

  // Destinataire
  draw('DESTINATAIRE', mm(6), y, 8, true); y -= mm(5)
  draw(`${to.firstName || ''} ${to.lastName || ''}`, mm(6), y); y-=mm(4)
  if (to.company) { draw(to.company, mm(6), y); y-=mm(4) }
  if (to.line1)   { draw(to.line1,   mm(6), y); y-=mm(4) }
  if (to.line2)   { draw(to.line2,   mm(6), y); y-=mm(4) }
  draw(`${to.postalCode || ''} ${to.city || ''}`, mm(6), y); y-=mm(4)
  draw(`${to.country || ''}`, mm(6), y); y-=mm(8)

  // Section tracking + QR
  draw(`Commande: ${order.id}`, mm(6), y, 9, true); y-=mm(5)
  const qr = await QRCode.toBuffer(order.id, { type: 'png', margin: 0, scale: 8 })
  const qrImg = await pdf.embedPng(qr)
  const size = mm(32)
  page.drawImage(qrImg, { x: width - mm(10) - size, y: y - size + mm(2), width: size, height: size })

  draw('Scan pour détails/retour', width - mm(10) - size, y - size - mm(3), 8)
  const bytes = await pdf.save()
  return Buffer.from(bytes)
}
