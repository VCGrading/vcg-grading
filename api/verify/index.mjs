// api/verify/index.mjs
import { supaAnon } from '../_db.mjs'

export default async function handler(req, res) {
  const key = req.query.id || req.query.serial || req.query.q
  if (!key || Array.isArray(key)) return res.status(400).json({ error: 'Missing id' })
  try {
    const { data, error } = await supaAnon
      .from('certificates')
      .select('*')
      .or(`id.eq.${key},serial.eq.${key}`)
      .order('date', { ascending: false })
      .limit(1)
    if (error) return res.status(500).json({ error: error.message })
    const row = data?.[0] || null
    if (!row) return res.status(404).json({ error: 'Not found' })
    return res.status(200).json(row)
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) })
  }
}
