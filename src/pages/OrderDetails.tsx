import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'

type Order = {
  id: string
  user_email: string
  plan: 'Standard' | 'Express' | 'Ultra' | string
  status: 'créée' | 'réceptionnée' | 'en évaluation' | 'évaluée' | 'expédiée' | string
  items: number
  total_cents: number
  created_at: string
  tracking?: string | null
  return_address?: any
}
type Item = {
  id?: number
  game?: string | null
  name?: string | null
  set?: string | null
  number?: string | null
  year?: number | null
  declared_value_cents?: number | null
  notes?: string | null
}

const STEPS: { key: Order['status']; label: string }[] = [
  { key: 'créée',         label: 'Créée' },
  { key: 'réceptionnée',  label: 'Réceptionnée' },
  { key: 'en évaluation', label: 'En évaluation' },
  { key: 'évaluée',       label: 'Évaluée' },
  { key: 'expédiée',      label: 'Expédiée' },
]

export default function OrderDetails() {
  // 🔧 ICI: on lit bien "orderId", pas "id"
  const { orderId: idFromParams } = useParams<{ orderId: string }>()
  const { search, pathname } = useLocation()
  const idFromQuery = new URLSearchParams(search).get('order') || undefined

  // petit fallback si jamais quelqu’un tape /orders/ORD-1234 sans param défini
  const pathTail = pathname.split('/').filter(Boolean).pop()
  const idFromPath = (pathTail && /^ORD-\d+/.test(pathTail)) ? pathTail : undefined

  const currentId = (idFromParams || idFromQuery || idFromPath || '').trim()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    let alive = true
    async function run() {
      if (!currentId) {
        setError('Identifiant de commande manquant.')
        setLoading(false)
        return
      }
      setLoading(true); setError(null)
      try {
        const r = await fetch(`/api/order?id=${encodeURIComponent(currentId)}`)
        const raw = await r.text()
        const data = raw ? JSON.parse(raw) : null
        if (!r.ok) throw new Error(data?.error || raw || `HTTP ${r.status}`)
        if (!alive) return
        setOrder(data.order)
        setItems(data.items || [])
      } catch (e: any) {
        if (!alive) return
        setError(e?.message || 'Commande introuvable')
      } finally {
        if (alive) setLoading(false)
      }
    }
    run()
    return () => { alive = false }
  }, [currentId])

  const stepIndex = useMemo(() => {
    const idx = STEPS.findIndex(s => s.key === order?.status)
    return idx === -1 ? 0 : idx
  }, [order])

  if (loading) {
    return (
      <section className="container py-12">
        <div className="card p-6">Chargement…</div>
      </section>
    )
  }

  if (error || !order) {
    return (
      <section className="container py-12">
        <div className="card p-6">
          <div className="text-lg font-semibold mb-2">Commande introuvable</div>
          <p className="text-muted">{error || 'Aucune commande ne correspond à cet identifiant.'}</p>
          <div className="mt-4">
            <Link to="/account" className="btn-outline">← Retour au compte</Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="container py-12">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl md:text-3xl font-bold">Commande {order.id}</h1>
        <Link to="/account" className="btn-outline">← Retour</Link>
      </div>

      <div className="card p-6">
        <div className="grid md:grid-cols-5 gap-4">
          {STEPS.map((s, i) => {
            const active = i <= stepIndex
            return (
              <div key={s.key} className="space-y-2">
                <div className={`h-1.5 rounded-full ${active ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
                <div className={`text-sm ${active ? 'font-semibold' : 'text-muted'}`}>{s.label}</div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 grid md:grid-cols-4 gap-4 text-sm">
          <div><div className="text-muted">Articles</div><div>{order.items}</div></div>
          <div><div className="text-muted">Total</div><div>{(order.total_cents / 100).toFixed(2)}€</div></div>
          <div><div className="text-muted">Plan</div><div>{order.plan}</div></div>
          <div><div className="text-muted">Créée le</div><div>{new Date(order.created_at).toLocaleDateString()}</div></div>
          {order.tracking && (
            <div className="md:col-span-4">
              <div className="text-muted">Tracking</div>
              <div className="font-mono">{order.tracking}</div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 card p-6">
        <div className="text-lg font-semibold mb-3">Détails des cartes</div>
        {items.length === 0 ? (
          <div className="text-sm text-muted">Aucune carte enregistrée.</div>
        ) : (
          <ul className="divide-y divide-border/70">
            {items.map((it, i) => (
              <li key={it.id ?? i} className="py-3 grid md:grid-cols-5 gap-3 text-sm">
                <div className="font-medium">{it.name || 'Sans nom'}</div>
                <div className="text-muted">{it.game || '—'}</div>
                <div className="text-muted">{it.set || '—'} {it.number ? ` ${it.number}` : ''}</div>
                <div className="text-muted">{it.year || '—'}</div>
                <div className="text-right md:text-left">
                  {it.declared_value_cents ? `${(it.declared_value_cents/100).toFixed(2)}€` : '—'}
                </div>
                {it.notes && <div className="md:col-span-5 text-xs text-muted">{it.notes}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
