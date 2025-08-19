import { useMemo } from 'react'

const TIERS = [
  { key: 'bois',    label: 'Bois',    min: 0,    discount: 0,  dot: 'bg-amber-600' },
  { key: 'pierre',  label: 'Pierre',  min: 100,  discount: 2,  dot: 'bg-slate-400' },
  { key: 'bronze',  label: 'Bronze',  min: 250,  discount: 4,  dot: 'bg-orange-500' },
  { key: 'argent',  label: 'Argent',  min: 500,  discount: 6,  dot: 'bg-slate-400' },
  { key: 'or',      label: 'Or',      min: 1000, discount: 8,  dot: 'bg-yellow-500' },
  { key: 'diamant', label: 'Diamant', min: 2000, discount: 12, dot: 'bg-sky-500' },
] as const

type Props = { spend: number } // cumul en €

export default function TiersShowcase({ spend }: Props) {
  // Palier courant + index
  const current = useMemo(() => {
    let idx = 0
    for (let i = 0; i < TIERS.length; i++) if (spend >= TIERS[i].min) idx = i
    return { ...TIERS[idx], idx }
  }, [spend])

  const next = TIERS[current.idx + 1] ?? null
  const rangeMin = current.min
  const rangeMax = next ? next.min : rangeMin + 1
  const progress = Math.max(0, Math.min(1, (spend - rangeMin) / (rangeMax - rangeMin)))
  const remaining = next ? Math.max(0, next.min - spend) : 0

  return (
    <section className="mt-8">
      {/* Header + résumé */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
        <div className="text-sm">
          <div className="font-medium">Réductions permanentes selon votre palier</div>
          <div className="text-muted">Cumulées automatiquement sur chaque commande.</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">Palier actuel :</span>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white dark:bg-slate-900 px-3 py-1 shadow-sm">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${current.dot}`} />
            <span className="font-medium">{current.label}</span>
            <span className="text-muted text-xs">({current.discount}% off)</span>
          </span>
        </div>
      </div>

      {/* Progression vers le prochain palier */}
      <div className="mt-4 rounded-xl border border-border p-4 bg-white/60 dark:bg-slate-900/40">
        <div className="flex items-center justify-between text-sm">
          <span>
            {next ? (
              <>Il vous reste <span className="font-semibold">{remaining}€</span> pour atteindre <span className="font-semibold">{next.label}</span> ({next.discount}%).</>
            ) : (
              <>Vous êtes au palier <span className="font-semibold">max</span> 🎉</>
            )}
          </span>
          <span className="text-muted">Total dépensé : {spend}€</span>
        </div>
        <div className="mt-2 h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-[width]"
            style={{ width: `${next ? Math.round(progress * 100) : 100}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs text-muted">
          <span>≥ {rangeMin}€</span>
          <span>{next ? `Prochain palier: ${next.min}€` : '—'}</span>
        </div>
      </div>

      {/* Cartes de paliers */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {TIERS.map((t, i) => {
          const active = i === current.idx
          return (
            <div
              key={t.key}
              className={[
                'relative rounded-2xl border p-4 bg-white dark:bg-slate-900',
                'border-border shadow-sm',
                active ? 'ring-2 ring-indigo-500 shadow-[0_0_0_6px_rgba(99,102,241,.08)]' : 'hover:shadow-md transition-shadow'
              ].join(' ')}
            >
              {active && (
                <span className="absolute -top-2 right-3 text-[10px] px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow">
                  Vous
                </span>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${t.dot}`} />
                  <div className="font-medium">{t.label}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted">Remise</div>
                  <div className="text-lg font-semibold">-{t.discount}%</div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-sm">
                <div className="text-muted">Seuil</div>
                <div className="font-medium">≥ {t.min}€</div>
              </div>

              <div className="mt-3 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full ${i < current.idx ? 'bg-indigo-400' : i === current.idx ? 'bg-indigo-600' : 'bg-slate-400/40'}`}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
