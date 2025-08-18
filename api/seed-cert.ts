import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supaService } from './_db'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const cert = {
    id: 'CERT-VCG-0001',
    serial: 'NG-0001',
    grade: 9.5,
    card: { game: 'Pokémon', name: 'Pikachu', set: 'Base Set', number: '58/102', year: 1999, imageUrl: '/cards/pikachu.jpg' },
    subgrades: { surface: 9.5, edges: 9, centering: 9, corners: 10 },
    qr_url: `${process.env.SITE_URL}/verify/CERT-VCG-0001`
  }
  const { error } = await supaService.from('certificates').upsert(cert)
  if (error) return res.status(500).json({ error: error.message })
  res.status(200).json({ ok: true })
}
