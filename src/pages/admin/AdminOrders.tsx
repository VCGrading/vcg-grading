import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'

type Item = {
  id: number
  order_id: string
  game: string
  name: string
  set?: string | null
  number?: string | null
  year?: string | null
  notes?: string | null
}
type AdminOrder = {
  id: string
  user_email: string
  plan: 'Standard'|'Express'|'Ultra'
  status: string
  items: number
  total_cents: number
  created_at: string
  tracking?: string | null
  order_items: Item[]
}

const STATUSES = ['créée', 'payée', 'réceptionnée', 'en évaluation', 'évaluée', 'expédiée']

export default function AdminOrders() {
  const { user, session, loading } = useAuth()
  const navigate = useNavigate()
  const allow = useMemo(() => {
    const env = (import.meta.env.VITE_ADMIN_EMAILS || '') as string
    return env.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  }, [])
  const isAdmin = !!(user?.email && allow.includes(user.email.toLowerCase()))

  const [list, setList] = useState<AdminOrder[]>([])
  const [fetching, setFetching] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, { status?: string; tracking?: string | null }>>({})

  useEffect(() => {
    if (!loading && !user) navigate('/login?next=/admin', { replace: true })
  }, [loading, user, navigate])

  useEffect(() => {
    if (!session || !isAdmin) return
    setFetching(true)
    fetch('/api/admin/orders', {
      headers: { Authorization: `Bearer ${session.access_token}` }
    })
      .then(async r => {
        const raw = await r.text()
        const data = raw ? JSON.parse(raw) : null
        if (!r.ok) throw new Error(data?.error || raw || `HTTP ${r.status}`)
        setList(data.orders || [])
      })
      .catch(e => setErr(e?.message || 'Erreur'))
      .finally(() => setFetching(false))
  }, [session, isAdmin])

  function setRowDraft(id: string, patch: Partial<{ status: string; tracking: string | null }>) {
    setDraft(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  async function save(id: string) {
    if (!session) return
    const payload = { id, ...draft[id] }
    if (!payload.status && typeof payload.tracking === 'undefined') return
    try {
      const r = await fetch('/api/admin/order-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      })
      const raw = await r.text()
      const data = raw ? JSON.parse(raw) : null
      if (!r.ok) throw new Error(data?.error || raw)
      // Update en place
      setList(prev => prev.map(o => (o.id === id ? { ...o, ...data.order } : o)))
      setDraft(prev => {
        const cp = { ...prev }
        delete cp[id]
        return cp
      })
    } catch (e: any) {
      alert(e?.message || 'Erreur')
    }
  }

  if (loading || !user) return null
  if (!isAdmin) {
    return (
      <section className="container py-12">
        <div className="card p-6">
          <div className="text-lg font-semibold mb-1">Accès refusé</div>
          <p className="text-muted">Votre compte n’est pas autorisé à accéder à l’admin.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="container py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Admin — Commandes</h1>
        <div className="text-sm text-muted">{fetching ? 'Mise à jour…' : `Total: ${list.length}`}</div>
      </div>

      {err && <div className="mt-4 text-sm text-red-600 dark:text-red-400">{err}</div>}

      <div className="mt-6 card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left bg-slate-50 dark:bg-slate-900">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Tracking</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Cartes</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {list.map(o => {
              const d = draft[o.id] || {}
              const draftStatus = d.status ?? o.status
              const draftTracking = typeof d.tracking === 'undefined' ? (o.tracking || '') : (d.tracking || '')
              const hasChanges = draftStatus !== o.status || (draftTracking || '') !== (o.tracking || '')

              return (
                <tr key={o.id} className="border-t border-border/70 align-top">
                  <td className="px-4 py-3 font-mono">{o.id}</td>
                  <td className="px-4 py-3">{new Date(o.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">{o.user_email}</td>
                  <td className="px-4 py-3">{o.plan}</td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded-lg border border-border bg-white dark:bg-slate-900 px-2 py-1"
                      value={draftStatus}
                      onChange={e => setRowDraft(o.id, { status: e.target.value })}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      className="w-[160px] rounded-lg border border-border bg-white dark:bg-slate-900 px-2 py-1"
                      value={draftTracking}
                      onChange={e => setRowDraft(o.id, { tracking: e.target.value })}
                      placeholder="CH123456789FR"
                    />
                  </td>
                  <td className="px-4 py-3">{(o.total_cents/100).toFixed(2)}€</td>
                  <td className="px-4 py-3">
                    <details>
                      <summary className="cursor-pointer text-muted">voir ({o.order_items.length})</summary>
                      <ul className="mt-2 space-y-1">
                        {o.order_items.map(it => (
                          <li key={it.id} className="text-xs">
                            {it.game} — {it.name}
                            {it.set ? ` (${it.set}${it.number ? ` ${it.number}` : ''})` : ''}
                            {it.year ? `, ${it.year}` : ''}
                            {it.notes ? ` — ${it.notes}` : ''}
                          </li>
                        ))}
                      </ul>
                    </details>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="btn-primary disabled:opacity-50"
                      disabled={!hasChanges}
                      onClick={() => save(o.id)}
                    >
                      Enregistrer
                    </button>
                  </td>
                </tr>
              )
            })}
            {list.length === 0 && !fetching && (
              <tr><td className="px-4 py-6 text-muted" colSpan={9}>Aucune commande.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
