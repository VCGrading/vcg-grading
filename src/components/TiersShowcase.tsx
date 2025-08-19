import Badge from './Badge'
import { TIERS, type Tier } from '../data/badges'

type Props = {
  /** Palier actuel de l'utilisateur (bois, pierre, bronze, argent, or, diamant).
   *  Si non fourni => aucun highlight. */
  activeTier?: Tier
  /** Dépenses cumulées de l'utilisateur en € pour la jauge vers le prochain palier. */
  currentSpend?: number
}

export default function TiersShowcase({ activeTier, currentSpend = 0 }: Props) {
  // Trouver le prochain palier pour la jauge
  const activeIndex = activeTier ? TIERS.findIndex(t => t.tier === activeTier) : -1
  const nextThreshold =
    activeIndex >= 0 && activeIndex < TIERS.length - 1
      ? TIERS[activeIndex + 1].threshold
      : undefined

  // Progression vers prochain palier
  const progress =
    nextThreshold && nextThreshold > 0
      ? Math.max(0, Math.min(1, currentSpend / nextThreshold))
      : 0

  return (
    <section className="mt-6">
      <div className="grid lg:grid-cols-6 md:grid-cols-3 grid-cols-2 gap-4">
        {TIERS.map(t => {
          const isActive = t.tier === activeTier
          return (
            <div key={t.tier} className={`card p-4 relative`}>
              {isActive && (
                <span className="absolute -top-2 left-3 text-[11px] px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow">
                  Vous
                </span>
              )}

              <div className="flex items-center justify-between">
                <Badge tier={t.tier as any} />
                <div className="text-right">
                  <div className="text-xs text-muted">Remise</div>
                  <div className="font-semibold">-{t.discount}%</div>
                </div>
              </div>

              <div className="mt-3 text-xs text-muted">Seuil</div>
              <div className="flex items-center justify-between">
                <div className="font-medium">≥ {t.threshold}€</div>
              </div>

              {/* Jauge : si c'est le palier actif et qu'on a currentSpend */}
              <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all ${isActive ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                  style={{ width: isActive ? `${Math.round(progress * 100)}%` : '100%' }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
