import { useEffect, useMemo, useState } from 'react'
import Badge from '../components/Badge'
import { tierForSpend } from '../data/badges'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import TiersShowcase from '../components/TiersShowcase'
import { mockUser } from '../data/mock'

type OrderRow = {
  id: string
  status: 'créée'|'réceptionnée'|'en évaluation'|'évaluée'|'expédiée'|string
  items: number
  total_cents: number
  created_at: string
  tracking?: string | null
  plan?: string
  user_email?: string
}

export default function Account() {
  const { t } = useI18n()

  // on part du mock pour l'affichage immédiat, puis on remplace par la data live
  const [email, setEmail] = useState<string>(() => {
    // récup depuis localStorage (OrderNew sauvegarde déjà l'email)
    try {
      const draft = JSON.parse(localStorage.getItem('orderDraft') || '{}')
      return draft?.email || localStorage.getItem('accountEmail') || mockUser.email
    } catch { return mockUser.email }
  })
  const [name] = useState<string>(mockUser.name)
  const [orders, setOrders] = useState<OrderRow[]>(mockUser.orders.map(o => ({
    id: o.id, status: o.status, items: o.items, total_cents: Math.round(o.total * 100),
    created_at: o.createdAt, tracking: o.tracking || null
  })))
  const [loading, setLoading] = useState<boolean>(false)

  // total dépensé (simple: somme des totaux; tu pourras filtrer par statut si tu veux)
  const totalSpend = useMemo(
    () => Math.max(0, orders.reduce((s, o) => s + (o.total_cents || 0), 0) / 100),
    [orders]
  )
  const tier = tierForSpend(totalSpend)

  useEffect(() => {
    if (!email) return
    setLoading(true)
    fetch(`/api/orders?email=${encodeURIComponent(email)}`)
      .then(async r => {
        const raw = await r.text()
        const data = raw ? JSON.parse(raw) : null
        if (!r.ok) throw new Error(data?.error || raw || `HTTP ${r.status}`)
        const list: OrderRow[] = (data?.orders || []).map((o: any) => ({
          id: o.id,
          status: o.status,
          items: o.items,
          total_cents: o.total_cents,
          created_at: o.created_at,
          tracking: o.tracking ?? null,
          plan: o.plan,
          user_email: o.user_email
        }))
        setOrders(list)
        localStorage.setItem('accountEmail', email)
      })
      .catch(() => {
        // en cas d'erreur API on garde simplement le mock (pas d'UI qui saute)
      })
      .finally(() => setLoading(false))
  }, [email])

  return (
    <section className="container py-12">
      <h1 className="text-2xl md:text-3xl font-bold">{t('account.title')}</h1>
      <TiersShowcase />

      <div className="mt-6 grid md:grid-cols-3 gap-6">
        {/* Carte profil */}
        <div className="md:col-span-1 card p-6">
          <div className="font-semibold">{name}</div>
          <div className="text-sm text-muted">{email}</div>
          <div className="mt-4 flex items-center gap-2">
            <Badge tier={tier.tier} />
            <div className="text-sm text-muted">-{tier.discount}% {t('account.permanentDiscount')}</div>
          </div>
          <div className="mt-4 text-sm text-muted">
            {t('account.cumulative')}: <b>{totalSpend.toFixed(2)}€</b>
          </div>
          {loading && <div className="mt-3 text-xs text-muted">Mise à jour…</div>}
        </div>

        {/* Tableau commandes — EXACTEMENT ton rendu */}
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
              {orders.length === 0 && !loading && (
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
