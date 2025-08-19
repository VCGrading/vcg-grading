// api/seed-cert.mjs
import { supaService } from './_db.mjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const cert = {
    id: 'CERT-VCG-0001',
    serial: 'NG-0001',
    grade: 9.5,
    card: { game: 'Pokémon', name: 'Pikachu', set: 'Base Set', number: '58/102', year: 1999, imageUrl: '/cards/pikachu.jpg' },
    subgrades: { surface: 9.5, edges: 9, centering: 9, corners: 10 },
    qr_url: `${process.env.SITE_URL}/verify/CERT-VCG-0001`
  }
  const { error } = await supaService.from('certificates').upsert(cert, { onConflict: 'id' })
  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ ok: true })
}
