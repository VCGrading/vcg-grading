// api/verify/[id].mjs
import { supaService } from '../_db.mjs'

export default async function handler(req, res) {
  const { id } = req.query
  if (!id || Array.isArray(id)) return res.status(400).json({ error: 'Missing id' })
  try {
    const { data, error } = await supaService
      .from('certificates')
      .select('*')
      .or(`id.eq.${id},serial.eq.${id}`)
      .order('date', { ascending: false })
      .limit(1)
    if (error) throw error
    const row = data?.[0] || null
    if (!row) return res.status(404).json({ error: 'Not found' })
    return res.status(200).json(row)
  } catch (e) {
    console.error('verify/[id] error', e)
    return res.status(500).json({ error: String(e?.message || e) })
  }
}
