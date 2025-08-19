// api/qr.mjs
import QRCode from 'qrcode'

export default async function handler(req, res) {
  try {
    const text = String(req.query.text || '').trim()
    if (!text) {
      res.status(400).json({ error: 'Missing text' })
      return
    }
    const size = Math.max(64, Math.min(512, parseInt(req.query.size || '140', 10) || 140))

    // SVG (léger et net dans l’UI et dans le PNG exporté)
    const svg = await QRCode.toString(text, { type: 'svg', width: size, margin: 1 })
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8')
    res.status(200).send(svg)
  } catch (e) {
    console.error('qr error', e)
    res.status(500).json({ error: 'QR_GEN_FAILED' })
  }
}
