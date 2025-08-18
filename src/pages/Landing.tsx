import { Link } from 'react-router-dom'
import Badge from '../components/Badge'
import { TIERS } from '../data/badges'
import { useI18n } from '../i18n'

type TierName = 'bois'|'pierre'|'bronze'|'argent'|'or'|'diamant'

export default function Landing() {
  const { t, lang } = useI18n()

  const benefits = ['expert','certificate','tracking','speed','shield','tiers'].map(k => ({
    key: k,
    title: t(`landing.benefits.items.${k}.title`),
    desc:  t(`landing.benefits.items.${k}.desc`),
    img:   `/illustrations/${k}.png`,
  }))

  const splits = [1,2,3,4].map(i => ({
    title:   t(`landing.splits.${i}.title`),
    desc:    t(`landing.splits.${i}.desc`),
    bullets: [1,2,3].map(b => t(`landing.splits.${i}.bullet${b}`)),
    img:     ['/illustrations/shipping.png','/illustrations/grading.png','/illustrations/qr.png','/illustrations/return.png'][i-1],
  }))

  const faqs = [1,2,3,4].map(i => ({
    q: t(`landing.faq.q${i}`),
    a: t(`landing.faq.a${i}`),
  }))

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
        <div className="container py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              {t('landing.hero.title', { highlight: t('landing.hero.highlight') })}
            </h1>
            <p className="mt-4 text-lg text-muted">{t('landing.hero.subtitle')}</p>
            <div className="mt-8 flex gap-3">
              <Link to="/order/new" className="btn-primary">{t('landing.hero.btnOrder')}</Link>
              <Link to="/verify" className="btn-outline">{t('landing.hero.btnVerify')}</Link>
            </div>
            <p className="mt-3 text-xs text-muted">{t('landing.hero.note')}</p>
          </div>

          {/* mock visuel */}
          <div className="card p-6 md:p-8">
            <Illus src="/illustrations/hero-cards.svg" label={t('landing.hero.illusLabel')} className="aspect-[4/3]" />
            <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
              <Feature title={t('landing.hero.feature.cert')} desc={t('landing.hero.feature.certDesc')} />
              <Feature title={t('landing.hero.feature.track')} desc={t('landing.hero.feature.trackDesc')} />
              <Feature title={t('landing.hero.feature.insured')} desc={t('landing.hero.feature.insuredDesc')} />
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="container py-16 md:py-8">
        <h2 className="text-2xl md:text-3xl font-bold">{t('landing.how.title')}</h2>
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {[
            [t('landing.how.step1.title'), t('landing.how.step1.desc'), '/illustrations/step-send.svg'],
            [t('landing.how.step2.title'), t('landing.how.step2.desc'), '/illustrations/step-grade.svg'],
            [t('landing.how.step3.title'), t('landing.how.step3.desc'), '/illustrations/step-certificate.png'],
          ].map(([title, desc, img]) => (
            <div key={String(title)} className="card p-6">
              <Illus src={img as string} className="aspect-[16/9]" />
              <h3 className="mt-4 font-semibold">{title as string}</h3>
              <p className="text-muted">{desc as string}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing + Tiers */}
      <section className="bg-slate-50 dark:bg-slate-900/60">
        <div className="container py-16 md:py-8">
          <h2 className="text-2xl md:text-3xl font-bold">{t('landing.pricing.title')}</h2>

          {/* Plans */}
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            {[
              [t('landing.pricing.standard'), t('landing.pricing.standard.desc'), 11.99],
              [t('landing.pricing.express'), t('landing.pricing.express.desc'), 29.99],
              [t('landing.pricing.ultra'), t('landing.pricing.ultra.desc'), 89.99],
            ].map(([name, subtitle, price]) => (
              <div key={String(name)} className="card p-6 flex flex-col">
                <h3 className="text-xl font-semibold">{name as string}</h3>
                <p className="text-muted">{subtitle as string}</p>
                <div className="mt-6 text-4xl font-bold">{price}€</div>
                <ul className="mt-6 space-y-2 text-sm text-muted flex-1">
                  <li>• {t('landing.pricing.feature1')}</li>
                  <li>• {t('landing.pricing.feature2')}</li>
                  <li>• {t('landing.pricing.feature3')}</li>
                </ul>
                <Link to="/order/new" className="btn-primary mt-6">{t('landing.hero.btnOrder')}</Link>
              </div>
            ))}
          </div>

          {/* Tiers — premium */}
          <section className="mt-12 rounded-3xl border border-border/70 overflow-hidden">
            {/* bandeau haut */}
            <div className="relative p-6 md:p-8 bg-gradient-to-br from-indigo-50 via-violet-50 to-sky-50 dark:from-slate-800/60 dark:via-slate-800/40 dark:to-slate-800/60">
              <div className="max-w-3xl">
                <div className="text-indigo-600 dark:text-indigo-300 font-semibold uppercase tracking-wider text-xs">
                  {t('landing.tiers.programLabel')}
                </div>
                <h3 className="mt-2 text-2xl md:text-3xl font-bold"
                    dangerouslySetInnerHTML={{ __html: t('landing.tiers.headlineHTML') }} />
                <p className="mt-2 text-muted">{t('landing.tiers.sub')}</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-2 text-sm">
                <Pill>{t('landing.tiers.pill.levels')}</Pill>
                <Pill>{t('landing.tiers.pill.auto')}</Pill>
                <Pill>{t('landing.tiers.pill.stackable')}</Pill>
              </div>
            </div>

            {/* cartes */}
            <div className="p-6 md:p-8 bg-white dark:bg-slate-950/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {TIERS.map(tier => (
                  <TierCardPremium
                    key={tier.tier}
                    tier={tier.tier as TierName}
                    label={t(`tiers.labels.${tier.tier}`)}
                    threshold={tier.threshold}
                    discount={tier.discount}
                  />
                ))}
              </div>

              {/* note + CTA */}
              <div className="mt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <p className="text-xs text-muted">{t('landing.tiers.note')}</p>
                <div className="flex gap-3">
                  <Link to="/order/new" className="btn-primary">{t('landing.ctaPrimary')}</Link>
                  <Link to="/account" className="btn-outline">{t('landing.ctaSecondary')}</Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>

      {/* Avantages illustrés */}
      <section className="container py-16 md:py-8">
        <h2 className="text-2xl md:text-3xl font-bold">{t('landing.benefits.title')}</h2>
        <p className="text-muted mt-2 max-w-2xl">{t('landing.benefits.lead')}</p>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map(card => (
            <div key={card.key} className="card p-6">
              <Illus src={card.img} className="aspect-[16/9]" />
              <h3 className="mt-4 font-semibold">{card.title}</h3>
              <p className="text-muted">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sections “split” alternées */}
      <section className="bg-slate-50 dark:bg-slate-900/60">
        <div className="container py-16 md:py-8 space-y-12">
          {splits.map((b, i) => (
            <div key={b.title} className={`grid lg:grid-cols-2 gap-8 items-center ${i % 2 ? 'lg:flex-row-reverse' : ''}`}>
              <Illus src={b.img} className="aspect-[4/3]" />
              <div>
                <h3 className="text-xl md:text-2xl font-semibold">{b.title}</h3>
                <p className="text-muted mt-2">{b.desc}</p>
                <ul className="mt-4 space-y-2 text-sm">
                  {b.bullets.map(x => <li key={x}>• {x}</li>)}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="container py-16 md:py-8">
        <h2 className="text-2xl md:text-3xl font-bold">FAQ</h2>
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          {faqs.map(({ q, a }) => (
            <details key={q} className="card p-4 open:shadow-md">
              <summary className="font-medium cursor-pointer">{q}</summary>
              <p className="mt-2 text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="container pb-16 md:pb-24">
        <div className="card p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl md:text-2xl font-bold">{t('landing.final.title')}</h3>
            <p className="text-muted">{t('landing.final.desc')}</p>
          </div>
          <div className="flex gap-3">
            <Link to="/order/new" className="btn-primary">{t('landing.final.primary')}</Link>
            <Link to="/account" className="btn-outline">{t('landing.final.secondary')}</Link>
          </div>
        </div>
      </section>
    </div>
  )
}

/* ---------- UI bits ---------- */
function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
      <div className="font-semibold">{title}</div>
      <div className="text-muted">{desc}</div>
    </div>
  )
}
function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/60 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 backdrop-blur px-3 py-1 text-xs shadow-sm">
      {children}
    </span>
  )
}
function TierCardPremium({ tier, label, threshold, discount }:{
  tier: TierName; label: string; threshold: number; discount: number
}) {
  const { t } = useI18n()
  const medalGrad: Record<TierName, string> = {
    bois: 'linear-gradient(135deg,#8b5a2b,#deb887)',
    pierre: 'linear-gradient(135deg,#6b7280,#cbd5e1)',
    bronze: 'linear-gradient(135deg,#b45309,#f59e0b)',
    argent: 'linear-gradient(135deg,#64748b,#cbd5e1)',
    or: 'linear-gradient(135deg,#ca8a04,#facc15)',
    diamant: 'linear-gradient(135deg,#22d3ee,#a78bfa)',
  }
  return (
    <div className="group relative rounded-3xl border border-white/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur
      shadow-[0_10px_30px_rgba(2,6,23,.06)] hover:shadow-[0_16px_40px_rgba(2,6,23,.12)] transition-shadow p-5">
      <div aria-hidden className="absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'conic-gradient(from 200deg at 50% 50%, rgba(99,102,241,.18), transparent 40%, rgba(56,189,248,.18), transparent 70%)' }} />
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14 shrink-0 rounded-full ring-1 ring-black/10 dark:ring-white/10 shadow-inner overflow-hidden grid place-items-center">
            <div className="absolute inset-[2px] rounded-full" style={{ background: medalGrad[tier] }} />
            <div className="absolute inset-0 rounded-full" style={{ boxShadow: 'inset 0 12px 24px rgba(255,255,255,.35), inset 0 -10px 18px rgba(0,0,0,.10)' }} />
            <div className="relative text-white text-[12px] font-bold leading-none drop-shadow-[0_1px_1px_rgba(0,0,0,.45)]">
              -{discount}%
            </div>
          </div>
          <div>
            <div className="text-xs text-muted">{t('landing.tiers.tier')}</div>
            <div className="font-semibold capitalize leading-tight">{label}</div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="text-muted">{t('landing.tiers.threshold')}</div>
          <div className="font-medium">≥ {threshold}€</div>
        </div>
        <div className="mt-3 h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
          <div className="h-full w-full" style={{ backgroundImage: medalGrad[tier] }} />
        </div>
      </div>
    </div>
  )
}
function Illus({ src, label, className = '' }: { src?: string; label?: string; className?: string }) {
  return (
    <div className={`relative rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 ring-1 ring-black/5 dark:ring-white/10 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={label || 'illustration'}
          className="w-full h-full object-contain p-6"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; e.currentTarget.parentElement!.insertAdjacentHTML('beforeend', fallbackHTML(label)); }}
        />
      ) : (
        <div dangerouslySetInnerHTML={{ __html: fallbackHTML(label) }} />
      )}
    </div>
  )
}
function fallbackHTML(label?: string) {
  return `
    <div class="absolute inset-0 grid place-items-center">
      <div class="w-24 h-24 rounded-xl bg-gradient-to-br from-indigo-200 to-sky-200 dark:from-indigo-700 dark:to-sky-700 shadow-inner"></div>
      ${label ? `<div class="absolute bottom-3 text-xs text-slate-500 dark:text-slate-300">${label}</div>` : ''}
    </div>
  `
}
