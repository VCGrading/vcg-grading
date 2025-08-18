import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supaClient } from '../_db'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query
  if (!id || Array.isArray(id)) return res.status(400).json({ error: 'Missing id' })

  // On accepte cert.id OU serial
  const { data, error } = await supaClient
    .from('certificates')
    .select('*')
    .or(`id.eq.${id},serial.eq.${id}`)
    .limit(1)
    .single()

  if (error) return res.status(500).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'Not found' })
  return res.status(200).json(data)
}
