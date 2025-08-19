// api/admin/_auth.mjs
import { supaService } from '../_db.mjs'

export async function checkAdmin(req) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) return { ok: false, status: 401, error: 'Missing bearer token' }

    const { data, error } = await supaService.auth.getUser(token)
    if (error) return { ok: false, status: 401, error: 'Invalid token' }
    const email = data?.user?.email
    if (!email) return { ok: false, status: 401, error: 'Invalid token' }

    const allow = String(process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean)

    if (!allow.includes(email.toLowerCase())) {
      return { ok: false, status: 403, error: 'Not an admin' }
    }
    return { ok: true, user: data.user }
  } catch (e) {
    return { ok: false, status: 401, error: 'Auth error', details: String(e?.message || e) }
  }
}
