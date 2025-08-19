import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n'
import Badge from '../components/Badge'
import TiersShowcase from '../components/TiersShowcase'
import { tierForSpend } from '../data/badges'
import { useAuth } from '../auth/AuthProvider'

type OrderRow = {
  id: string
  status: string
  items: number
  total_cents: number
  created_at: string
  tracking?: string | null
  plan?: string
}

export default function Account() {
  const { t } = useI18n()
  const { user, session, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) navigate('/login?next=/account', { replace: true })
  }, [loading, user, navigate])

  const [orders, setOrders] = useState<OrderRow[]>([])
  const [fetching, setFetching] = useState(false)

  const totalSpend = useMemo(
    () => Math.max(0, orders.reduce((s, o) => s + (o.total_cents || 0), 0) / 100),
    [orders]
  )
  const tier = tierForSpend(totalSpend)

  useEffect(() => {
    if (!session) return
    setFetching(true)
    fetch('/api/orders', {
      headers: { Authorization: `Bearer ${session.access_token}` }
    })
      .then(async r => {
        const raw = await r.text()
        const data = raw ? JSON.parse(raw) : null
        if (!r.ok) throw new Error(data?.error || raw || `HTTP ${r.status}`)
        const list: OrderRow[] = (data?.orders || []).map((o: any) => ({
          id: o.id, status: o.status, items: o.items, total_cents: o.total_cents, created_at: o.created_at, plan: o.plan, tracking: o.tracking ?? null
        }))
        setOrders(list)
      })
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [session])

  if (loading || !user) return null

  return (
    <section className="container py-12">
      <h1 className="text-2xl md:text-3xl font-bold">{t('account.title')}</h1>

      {/* Branché sur le montant réel */}
      <TiersShowcase spend={totalSpend} />

      <div className="mt-6 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 card p-6">
          <div className="font-semibold">{user.email?.split('@')[0]}</div>
          <div className="text-sm text-muted">{user.email}</div>
          <div className="mt-4 flex items-center gap-2">
            <Badge tier={tier.tier} />
            <div className="text-sm text-muted">-{tier.discount}% {t('account.permanentDiscount')}</div>
          </div>
          <div className="mt-4 text-sm text-muted">
            {t('account.cumulative')}: <b>{totalSpend.toFixed(2)}€</b>
          </div>
          {fetching && <div className="mt-3 text-xs text-muted">Mise à jour…</div>}
        </div>

        <div className="md:col-span-2 card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-left bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3">{t('account.table.order')}</th>
                <th className="px-4 py-3">{t('account.table.status')}</th>
                <th className="px-4 py-3">{t('account.table.items')}</th>
                <th className="px-4 py-3">{t('account.table.total')}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-t border-border/70">
                  <td className="px-4 py-3 font-mono">{o.id}</td>
                  <td className="px-4 py-3">{o.status}</td>
                  <td className="px-4 py-3">{o.items}</td>
                  <td className="px-4 py-3">{(o.total_cents/100).toFixed(2)}€</td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/orders/${o.id}?order=${o.id}`} className="btn-outline">
                      {t('account.table.details')}
                    </Link>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && !fetching && (
                <tr className="border-t border-border/70">
                  <td className="px-4 py-6 text-muted" colSpan={5}>
                    {t('account.empty') || 'Aucune commande pour cet email.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
