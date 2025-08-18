import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { mockUser, type Order } from '../data/mock'
import { useI18n } from '../i18n'

const STEP_LABELS_FR = ['Créée', 'Réceptionnée', 'En évaluation', 'Évaluée', 'Expédiée']
const STEPS = ['créée','réceptionnée','en évaluation','évaluée','expédiée'] as const
type Step = typeof STEPS[number]

function stepIndex(status: Step) { return STEPS.indexOf(status) }
function fmt(dateISO: string) { return new Date(dateISO).toLocaleDateString() }
function addDays(dateISO: string, days: number) { const d=new Date(dateISO); d.setDate(d.getDate()+days); return d.toISOString() }
function etaFrom(order: Order) { return addDays(order.createdAt, 10) }
function statusBadgeColor(s: Step) {
  switch (s) {
    case 'créée': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
    case 'réceptionnée': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200'
    case 'en évaluation': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
    case 'évaluée': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
    case 'expédiée': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200'
  }
}

export default function OrderDetails() {
  const { t } = useI18n()
  const { orderId } = useParams()
  const order = useMemo(() => mockUser.orders.find(o => o.id === orderId), [orderId])

  if (!order) {
    return (
      <section className="container py-12">
        <div className="card p-8">
          <h1 className="text-2xl md:text-3xl font-bold">Commande introuvable</h1>
          <p className="mt-2 text-muted">Vérifie l’identifiant ou reviens à <Link to="/account" className="underline">ton compte</Link>.</p>
        </div>
      </section>
    )
  }

  const idx = stepIndex(order.status)
  const eta = etaFrom(order)
  const statusLabel = order.status.charAt(0).toUpperCase() + order.status.slice(1)
  const trackingLink = order.tracking ? `https://www.google.com/search?q=${encodeURIComponent(order.tracking)}` : undefined
  const timeline = [
    { label: STEP_LABELS_FR[0], at: order.createdAt },
    { label: STEP_LABELS_FR[1], at: addDays(order.createdAt, 2) },
    { label: STEP_LABELS_FR[2], at: addDays(order.createdAt, 4) },
    { label: STEP_LABELS_FR[3], at: addDays(order.createdAt, 8) },
    { label: STEP_LABELS_FR[4], at: addDays(order.createdAt, 10) },
  ]

  return (
    <section className="container py-12">
      {/* Header avec bouton retour */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/account" className="btn-outline">← Retour compte</Link>
          <h1 className="text-2xl md:text-3xl font-bold">Commande {order.id}</h1>
        </div>
        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${statusBadgeColor(order.status)}`}>
          <span className="inline-block w-2 h-2 rounded-full bg-current/70" />
          {statusLabel}
        </span>
      </div>

      <div className="card p-6 mt-6">
        {/* Progress */}
        <ol className="grid grid-cols-5 gap-4">
          {STEP_LABELS_FR.map((label, i) => {
            const active = i <= idx
            return (
              <li key={label} className="flex flex-col">
                <div className="flex items-center gap-3">
                  <div className={`h-2 flex-1 rounded-full ${active ? 'bg-indigo-500' : 'bg-border'}`} />
                </div>
                <div className={`mt-2 text-sm ${active ? 'text-foreground' : 'text-muted'}`}>{label}</div>
              </li>
            )
          })}
        </ol>

        {/* Infos */}
        <div className="mt-6 grid md:grid-cols-4 gap-6">
          <div className="rounded-xl border border-border p-4">
            <div className="text-xs text-muted">Articles</div>
            <div className="text-lg font-semibold">{order.items}</div>
            <div className="mt-4 text-xs text-muted">Total</div>
            <div className="text-lg font-semibold">{order.total}€</div>
          </div>

          <div className="rounded-xl border border-border p-4">
            <div className="text-xs text-muted">Créée le</div>
            <div className="font-medium">{fmt(order.createdAt)}</div>
            <div className="mt-4 text-xs text-muted">ETA</div>
            <div className="font-medium">{fmt(eta)}</div>
          </div>

          <div className="rounded-xl border border-border p-4">
            <div className="text-xs text-muted">Tracking</div>
            {order.tracking ? (
              <div className="mt-1 flex items-center gap-2">
                <a href={trackingLink} target="_blank" rel="noreferrer" className="px-2 py-1 rounded border border-border font-mono text-sm hover:bg-surface">
                  {order.tracking}
                </a>
                <button className="btn-outline px-2 py-1 text-xs" onClick={async () => { try { await navigator.clipboard.writeText(order.tracking!) } catch {} }}>
                  Copier
                </button>
              </div>
            ) : <div className="text-muted mt-1">—</div>}
            <div className="mt-4 text-xs text-muted">Conseil</div>
            <p className="text-sm">Le suivi s’active 24–48h après l’expédition.</p>
          </div>

          <div className="rounded-xl border border-border p-4">
            <div className="text-xs text-muted">Actions</div>
            <div className="mt-2 flex flex-col gap-2">
              <button className="btn-primary">Contacter le support</button>
              <button className="btn-outline">Télécharger facture (mock)</button>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-8">
          <div className="text-sm font-medium">Timeline</div>
          <ul className="mt-3 space-y-3">
            {timeline.map((it, i) => {
              const active = i <= idx
              return (
                <li key={i} className="flex items-start gap-3">
                  <span className={`mt-1 inline-flex w-2 h-2 rounded-full ${active ? 'bg-indigo-500' : 'bg-border'}`} />
                  <div>
                    <div className={`text-sm ${active ? 'text-foreground' : 'text-muted'}`}>{it.label}</div>
                    <div className="text-xs text-muted">{fmt(it.at)}</div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
