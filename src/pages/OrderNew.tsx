import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { tierForSpend } from '../data/badges'
import { mockUser } from '../data/mock'
import { useI18n } from '../i18n'

type Plan = 'Standard' | 'Express' | 'Ultra'
type CardInput = {
  game: 'Pokémon' | 'Yu-Gi-Oh!' | 'Magic' | 'Autre'
  name: string
  set: string
  number: string
  year: string
  declared: string
  notes: string
}

const EMPTY_CARD: CardInput = {
  game: 'Pokémon',
  name: '', set: '', number: '', year: '', declared: '', notes: ''
}

const STORAGE_KEY = 'orderDraft'
const COUPONS: Record<string, number> = { WELCOME10: 10, VCG5: 5 }

export default function OrderNew() {
  const { t } = useI18n()
  const navigate = useNavigate()

  const [plan, setPlan] = useState<Plan>('Standard')
  const [cards, setCards] = useState<CardInput[]>([{ ...EMPTY_CARD }])
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)

  // Charger brouillon
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      const d = JSON.parse(raw)
      if (d?.plan) setPlan(d.plan)
      if (Array.isArray(d?.cards) && d.cards.length) setCards(d.cards)
      if (d?.appliedCoupon) setAppliedCoupon(d.appliedCoupon)
    } catch {}
  }, [])

  // Sauver brouillon
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ plan, cards, appliedCoupon }))
  }, [plan, cards, appliedCoupon])

  const resetDraft = () => {
    setPlan('Standard')
    setCards([{ ...EMPTY_CARD }])
    setAppliedCoupon(null)
    setCouponInput('')
    localStorage.removeItem(STORAGE_KEY)
  }

  const tier = tierForSpend(mockUser.totalSpend)
  const basePrices: Record<Plan, number> = { Standard: 11.99, Express: 29.99, Ultra: 89.99 }
  const subtotal = basePrices[plan] * cards.length
  const discountTier = subtotal * (tier.discount / 100)
  const couponPct = appliedCoupon ? COUPONS[appliedCoupon] ?? 0 : 0
  const discountCoupon = subtotal * (couponPct / 100)
  const total = Math.max(0, subtotal - discountTier - discountCoupon)

  function updateCard(i: number, patch: Partial<CardInput>) {
    setCards(prev => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)))
  }
  function addCard() { setCards(prev => [...prev, { ...EMPTY_CARD }]) }
  function removeCard(i: number) { setCards(prev => prev.filter((_, idx) => idx !== i)) }

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase()
    setAppliedCoupon(COUPONS[code] ? code : null)
  }

  const goNext = () => navigate('/order/address')  // 👉 étape Adresse obligatoire

  return (
    <section className="container py-12 md:pb-12 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">{t('order.title')}</h1>
        <button type="button" className="btn-outline" onClick={resetDraft}>{t('order.reset')}</button>
      </div>

      <div className="mt-6 grid md:grid-cols-3 gap-6">
        {/* Formulaire principal */}
        <form className="md:col-span-2 card p-6" onSubmit={e => { e.preventDefault(); goNext() }}>
          {/* Formule + code promo */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted">{t('order.plan')}</label>
              <select
                value={plan}
                onChange={e => setPlan(e.target.value as Plan)}
                className="mt-1 w-full rounded-lg border border-border bg-white dark:bg-slate-900 px-4 py-2"
              >
                <option>Standard</option>
                <option>Express</option>
                <option>Ultra</option>
              </select>
              <p className="text-xs text-muted mt-1">
                {t('order.pricePerCard', { price: String(basePrices[plan]) })}
              </p>
            </div>

            <div>
              <label className="text-sm text-muted">{t('order.coupon')}</label>
              <div className="mt-1 flex gap-2">
                <input
                  value={couponInput}
                  onChange={e => setCouponInput(e.target.value)}
                  placeholder="WELCOME10"
                  className="flex-1 rounded-lg border border-border bg-white dark:bg-slate-900 px-4 py-2"
                />
                <button type="button" className="btn-outline" onClick={applyCoupon}>
                  {t('order.coupon.apply')}
                </button>
              </div>
              {appliedCoupon && (
                <p className="text-xs text-muted mt-1">
                  {t('order.coupon.applied', { code: appliedCoupon, pct: String(COUPONS[appliedCoupon]) })}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <button type="button" onClick={addCard} className="btn-outline">
              {t('order.addCard')}
            </button>
          </div>

          {/* Liste de cartes */}
          <div className="mt-6 space-y-6">
            {cards.map((card, i) => (
              <div key={i} className="rounded-xl border border-border/70 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{t('order.card', { i: String(i + 1) })}</div>
                  <button
                    type="button"
                    onClick={() => removeCard(i)}
                    className="text-sm text-muted hover:text-foreground"
                    disabled={cards.length === 1}
                    title={cards.length === 1 ? t('order.delete.disabled') : t('order.delete')}
                  >
                    {t('order.delete')}
                  </button>
                </div>

                <div className="mt-4 grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted">{t('order.game')}</label>
                    <select
                      value={card.game}
                      onChange={e => updateCard(i, { game: e.target.value as CardInput['game'] })}
                      className="mt-1 w-full rounded-lg border border-border bg-white dark:bg-slate-900 px-4 py-2"
                    >
                      <option>{t('order.game.pokemon')}</option>
                      <option>{t('order.game.yugioh')}</option>
                      <option>{t('order.game.magic')}</option>
                      <option>{t('order.game.other')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-muted">{t('order.cardName')}</label>
                    <input
                      value={card.name}
                      onChange={e => updateCard(i, { name: e.target.value })}
                      placeholder="Pikachu"
                      className="mt-1 w-full rounded-lg border border-border bg-white dark:bg-slate-900 px-4 py-2"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-muted">{t('order.set')}</label>
                    <input
                      value={card.set}
                      onChange={e => updateCard(i, { set: e.target.value })}
                      placeholder="Base Set"
                      className="mt-1 w-full rounded-lg border border-border bg-white dark:bg-slate-900 px-4 py-2"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-muted">{t('order.number')}</label>
                    <input
                      value={card.number}
                      onChange={e => updateCard(i, { number: e.target.value })}
                      placeholder="58/102"
                      className="mt-1 w-full rounded-lg border border-border bg-white dark:bg-slate-900 px-4 py-2"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-muted">{t('order.year')}</label>
                    <input
                      value={card.year}
                      onChange={e => updateCard(i, { year: e.target.value })}
                      placeholder="1999"
                      inputMode="numeric"
                      className="mt-1 w-full rounded-lg border border-border bg-white dark:bg-slate-900 px-4 py-2"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-muted">{t('order.declared')}</label>
                    <input
                      value={card.declared}
                      onChange={e => updateCard(i, { declared: e.target.value })}
                      placeholder="Optionnel"
                      inputMode="decimal"
                      className="mt-1 w-full rounded-lg border border-border bg-white dark:bg-slate-900 px-4 py-2"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-sm text-muted">{t('order.notes')}</label>
                    <textarea
                      value={card.notes}
                      onChange={e => updateCard(i, { notes: e.target.value })}
                      rows={3}
                      placeholder="Infos"
                      className="mt-1 w-full rounded-lg border border-border bg-white dark:bg-slate-900 px-4 py-2"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Ajouter en bas */}
          <div className="mt-4">
            <button type="button" onClick={addCard} className="btn-outline">
              {t('order.addCard')}
            </button>
          </div>

          {/* 👉 Étape suivante : Adresse (pas Stripe ici) */}
          <button type="submit" className="btn-primary mt-6">Continuer</button>
          <p className="mt-2 text-xs text-muted">Étape suivante : votre adresse de retour.</p>
        </form>

        {/* Récapitulatif */}
        <aside className="card p-6 h-max md:sticky md:top-24">
          <div className="font-semibold">{t('order.summary')}</div>
          <div className="mt-3 text-sm space-y-2">
            <div className="flex justify-between"><span>{t('order.summary.cards')}</span><span>{cards.length}</span></div>
            <div className="flex justify-between"><span>{t('order.summary.plan')}</span><span>{plan}</span></div>
            <div className="flex justify-between"><span>{t('order.summary.subtotal')}</span><span>{subtotal.toFixed(2)}€</span></div>
            <div className="flex justify-between text-muted">
              <span>{t('order.summary.tierDiscount', { discount: String(tier.discount) })}</span>
              <span>-{discountTier.toFixed(2)}€</span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-muted">
                <span>{t('order.summary.couponDiscount', { code: appliedCoupon })}</span>
                <span>-{discountCoupon.toFixed(2)}€</span>
              </div>
            )}
            <div className="border-t border-border/70 my-2" />
            <div className="flex justify-between font-semibold"><span>{t('order.summary.total')}</span><span>{total.toFixed(2)}€</span></div>
          </div>
        </aside>
      </div>

      {/* Bottom bar mobile */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/70 bg-surface/95 dark:bg-slate-950/90 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted">{t('order.summary.total')}</div>
            <div className="text-lg font-semibold">{total.toFixed(2)}€</div>
          </div>
          <button className="btn-primary" onClick={goNext}>
            Continuer
          </button>
        </div>
      </div>
    </section>
  )
}
