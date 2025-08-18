import { supaClient } from './_db.js'

export default async function handler(req, res) {
  const { id } = req.query
  if (!id || Array.isArray(id)) return res.status(400).json({ error: 'Missing id' })

  try {
    const { data, error } = await supaClient
      .from('certificates')
      .select('*')
      .or(`id.eq.${id},serial.eq.${id}`)
      .limit(1)
      .single()

    if (error) return res.status(500).json({ error: error.message })
    if (!data) return res.status(404).json({ error: 'Not found' })
    return res.status(200).json(data)
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) })
  }
}
