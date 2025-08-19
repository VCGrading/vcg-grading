// api/population.mjs  -> GET /api/population?name=...&set=...&number=...&year=1999
import { supaService } from './_db.mjs'

export default async function handler(req, res) {
  const q = req.query || {}
  const name   = q.name
  const set    = q.set
  const number = q.number
  const year   = q.year

  if (!name || !set || !number || !year) {
    return res.status(400).json({ error: 'Missing params' })
  }

  try {
    const y = Number(year)
    const { data, error } = await supaService
      .from('certificates')
      .select('grade')
      .contains('card', { name, set, number, year: y })

    if (error) throw error

    const byGrade = {}
    let total = 0
    for (const row of (data || [])) {
      const g = String(row.grade)
      byGrade[g] = (byGrade[g] || 0) + 1
      total++
    }

    const byGradeSorted = Object.fromEntries(
      Object.entries(byGrade).sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]))
    )

    return res.status(200).json({ total, byGrade: byGradeSorted })
  } catch (e) {
    console.error('population error', e)
    return res.status(500).json({ error: 'SERVER_ERROR', message: String(e?.message || e) })
  }
}
