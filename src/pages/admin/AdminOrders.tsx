import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import StatusBadge from '../../components/StatusBadge'

type Item = {
  id: number
  order_id: string
  game: string
  name: string
  set?: string | null
  number?: string | null
  year?: string | null
  declared_value_cents?: number | null
  notes?: string | null
}

type OrderRow = {
  id: string
  created_at: string
  user_email: string
  plan: string
  status: string
  tracking?: string | null
  total_cents: number
  return_address?: any | null
  order_items?: Item[]
}

const ALLOWED = ['créée', 'payée', 'réceptionnée', 'en évaluation', 'évaluée', 'expédiée']

function fmtMoney(cents: number) {
  return (Math.max(0, cents) / 100).toFixed(2) + '€'
}
function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleString() } catch { return iso }
}

export default function AdminOrders() {
  const { session, user } = useAuth()
  const [list, setList] = useState<OrderRow[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [fetching, setFetching] = useState(false)

  // UI state
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<string>('all')
  const [sort, setSort] = useState<'date-desc'|'date-asc'|'total-desc'|'total-asc'>('date-desc')
  const [page, setPage] = useState(1)
  const pageSize = 12
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [savingRow, setSavingRow] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const isAdmin = useMemo(() => {
    const allow = (import.meta.env.VITE_ADMIN_EMAILS || '')
      .split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean)
    return !!user?.email && allow.includes(user.email.toLowerCase())
  }, [user])

  useEffect(() => {
    if (!session || !isAdmin) return
    setFetching(true)
    fetch('/api/admin/orders', {
      headers: { Authorization: `Bearer ${session.access_token}` }
    })
      .then(async r => {
        const ct = r.headers.get('content-type') || ''
        const raw = await r.text()
        const data = ct.includes('application/json') ? (raw ? JSON.parse(raw) : null) : null
        if (!r.ok) throw new Error(data?.error || raw || `HTTP ${r.status}`)
        setList(data?.orders || [])
      })
      .catch(e => setErr(e?.message || 'Erreur'))
      .finally(() => setFetching(false))
  }, [session, isAdmin])

  // Filtres + tri
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    let arr = list.filter(o => {
      if (status !== 'all' && o.status !== status) return false
      if (!needle) return true
      return (
        o.id.toLowerCase().includes(needle) ||
        (o.user_email || '').toLowerCase().includes(needle) ||
        (o.tracking || '').toLowerCase().includes(needle)
      )
    })
    switch (sort) {
      case 'date-asc': arr = arr.sort((a,b)=>a.created_at.localeCompare(b.created_at)); break
      case 'date-desc': arr = arr.sort((a,b)=>b.created_at.localeCompare(a.created_at)); break
      case 'total-asc': arr = arr.sort((a,b)=>(a.total_cents - b.total_cents)); break
      case 'total-desc': arr = arr.sort((a,b)=>(b.total_cents - a.total_cents)); break
    }
    return arr
  }, [list, q, status, sort])

  // Pagination
  const maxPage = Math.max(1, Math.ceil(filtered.length / pageSize))
  useEffect(() => { if (page > maxPage) setPage(maxPage) }, [page, maxPage])
  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page])

  // Inline update
  async function saveRow(o: OrderRow, patch: Partial<OrderRow>) {
    if (!session) return
    setSavingRow(o.id)
    setErr(null)
    try {
      const r = await fetch('/api/admin/order-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ id: o.id, status: patch.status, tracking: patch.tracking })
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`)
      setList(prev => prev.map(x => x.id === o.id ? { ...x, ...patch } : x))
      setNotice('Modifications enregistrées ✔')
      setTimeout(()=>setNotice(null), 2000)
    } catch (e: any) {
      setErr(e?.message || 'Erreur serveur')
    } finally {
      setSavingRow(null)
    }
  }

  if (!isAdmin) {
    return (
      <section className="container py-12">
        <div className="card p-6">Accès refusé.</div>
      </section>
    )
  }

  return (
    <section className="container py-12">
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Admin — Commandes</h1>
        <div className="text-sm text-muted">Total: {filtered.length}</div>
      </div>

      {/* Bar filters */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={e => { setQ(e.target.value); setPage(1) }}
          placeholder="Rechercher (ID, email, tracking)"
          className="rounded-lg border border-border bg-white dark:bg-slate-900 px-3 py-2 w-full sm:w-80"
        />
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1) }}
          className="rounded-lg border border-border bg-white dark:bg-slate-900 px-3 py-2"
        >
          <option value="all">Tous les statuts</option>
          {ALLOWED.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={sort}
          onChange={e => setSort(e.target.value as any)}
          className="rounded-lg border border-border bg-white dark:bg-slate-900 px-3 py-2"
        >
          <option value="date-desc">Tri: Date ↓</option>
          <option value="date-asc">Tri: Date ↑</option>
          <option value="total-desc">Tri: Total ↓</option>
          <option value="total-asc">Tri: Total ↑</option>
        </select>
        <button
          className="btn-outline ml-auto"
          onClick={() => { setQ(''); setStatus('all'); setSort('date-desc'); setPage(1) }}
        >
          Réinitialiser
        </button>
      </div>

      {/* Feedback */}
      {err && <div className="mt-3 text-sm text-red-600 dark:text-red-400">{err}</div>}
      {notice && <div className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">{notice}</div>}

      <div className="mt-4 card p-0 overflow-hidden">
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
            {fetching && (
              <tr className="border-t border-border/70">
                <td className="px-4 py-6 text-muted" colSpan={9}>Chargement…</td>
              </tr>
            )}

            {!fetching && pageItems.map(o => {
              const isOpen = !!expanded[o.id]
              return (
                <React.Fragment key={o.id}>
                  <tr className="border-t border-border/70 align-top">
                    <td className="px-4 py-3 font-mono">{o.id}</td>
                    <td className="px-4 py-3">{fmtDate(o.created_at)}</td>
                    <td className="px-4 py-3">{o.user_email}</td>
                    <td className="px-4 py-3">{o.plan}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={o.status} />
                        <select
                          className="rounded border border-border bg-white dark:bg-slate-900 px-2 py-1 text-xs"
                          defaultValue={o.status}
                          onChange={e => saveRow(o, { status: e.target.value })}
                          disabled={savingRow === o.id}
                        >
                          {ALLOWED.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <input
                          defaultValue={o.tracking || ''}
                          placeholder="N°"
                          className="rounded border border-border bg-white dark:bg-slate-900 px-2 py-1 text-xs w-36"
                          onBlur={e => {
                            const val = e.currentTarget.value
                            if ((o.tracking || '') !== val) saveRow(o, { tracking: val })
                          }}
                          disabled={savingRow === o.id}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">{fmtMoney(o.total_cents)}</td>
                    <td className="px-4 py-3">{o.order_items?.length || 0}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="btn-outline"
                        onClick={() => setExpanded(s => ({ ...s, [o.id]: !s[o.id] }))}
                      >
                        {isOpen ? 'Fermer' : 'Détails'}
                      </button>
                    </td>
                  </tr>

                  {isOpen && (
                    <tr className="border-t border-border/70 bg-slate-50/50 dark:bg-slate-900/30">
                      <td colSpan={9} className="px-4 py-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Cartes */}
                          <div className="rounded-lg border border-border p-3">
                            <div className="font-semibold mb-2">Cartes ({o.order_items?.length || 0})</div>
                            <ul className="text-xs space-y-1">
                              {(o.order_items || []).map(it => (
                                <li key={it.id}>
                                  • {it.game} — {it.name}
                                  {it.set ? ` (${it.set}${it.number ? ` ${it.number}` : ''})` : ''}
                                  {it.year ? `, ${it.year}` : ''}
                                  {typeof it.declared_value_cents === 'number' ? ` — ${fmtMoney(it.declared_value_cents)}` : ''}
                                  {it.notes ? ` — ${it.notes}` : ''}
                                </li>
                              ))}
                              {!o.order_items?.length && <li className="text-muted">Aucune carte</li>}
                            </ul>
                          </div>

                          {/* Adresse */}
                          <div className="rounded-lg border border-border p-3">
                            <div className="font-semibold mb-2">Adresse de retour</div>
                            {o.return_address ? (
                              <div className="text-sm leading-6">
                                <div>{o.return_address.firstName} {o.return_address.lastName}</div>
                                {o.return_address.company && <div>{o.return_address.company}</div>}
                                <div>{o.return_address.line1}</div>
                                {o.return_address.line2 && <div>{o.return_address.line2}</div>}
                                <div>{o.return_address.postalCode} {o.return_address.city}</div>
                                <div>{o.return_address.country}</div>
                                {o.return_address.phone && <div>Tél: {o.return_address.phone}</div>}
                                <div className="text-muted text-xs mt-1">{o.user_email}</div>
                                {o.return_address.instructions && (
                                  <div className="text-xs mt-2 p-2 rounded bg-slate-100 dark:bg-slate-800">
                                    {o.return_address.instructions}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-muted text-sm">—</div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}

            {!fetching && pageItems.length === 0 && (
              <tr className="border-t border-border/70">
                <td className="px-4 py-6 text-muted" colSpan={9}>Aucune commande.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-muted">
          Page {page}/{maxPage}
        </div>
        <div className="flex gap-2">
          <button className="btn-outline" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Préc.</button>
          <button className="btn-outline" disabled={page>=maxPage} onClick={()=>setPage(p=>Math.min(maxPage,p+1))}>Suiv.</button>
        </div>
      </div>
    </section>
  )
}
