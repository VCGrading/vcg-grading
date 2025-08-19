import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const STORAGE_KEY = 'orderDraft'

type Address = {
  firstName: string
  lastName: string
  company?: string
  line1: string
  line2?: string
  postalCode: string
  city: string
  country: string
  phone?: string
  instructions?: string
  email: string
}

const isCardValid = (c: any) => (String(c?.name || '').trim().length >= 2)

export default function OrderAddress() {
  const navigate = useNavigate()

  const [draft, setDraft] = useState<any | null>(null)
  const [ready, setReady] = useState(false) // on attend la lecture du storage
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [addr, setAddr] = useState<Address>({
    firstName: '',
    lastName: '',
    company: '',
    line1: '',
    line2: '',
    postalCode: '',
    city: '',
    country: 'FR',
    phone: '',
    instructions: '',
    email: localStorage.getItem('accountEmail') || ''
  })

  // Lire le brouillon depuis localStorage au mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setDraft(JSON.parse(raw))
    } catch {}
    setReady(true)
  }, [])

  // Ne considérer que les cartes VALIDE
  const validCards: any[] = (draft?.cards || []).filter(isCardValid)
  const hasDraft = !!draft?.plan && validCards.length > 0

  // Anti-bypass: si pas de brouillon valide -> redirige automatiquement
  useEffect(() => {
    if (!ready) return
    if (!hasDraft) {
      navigate('/order/new?empty=1', { replace: true })
    }
  }, [ready, hasDraft, navigate])

  const total = useMemo(() => {
    if (!hasDraft) return 0
    const base: Record<string, number> = { Standard: 11.99, Express: 29.99, Ultra: 89.99 }
    const price = base[draft.plan] ?? 0
    const couponPct = draft.appliedCoupon ? ({ WELCOME10: 10, VCG5: 5 } as Record<string, number>)[draft.appliedCoupon] ?? 0 : 0
    const gross = price * validCards.length
    const minusCoupon = gross * (couponPct / 100)
    return Math.max(0, gross - minusCoupon)
  }, [draft, hasDraft, validCards])

  function update<K extends keyof Address>(key: K, val: Address[K]) {
    setAddr(a => ({ ...a, [key]: val }))
  }

  function validate(d: any): string | null {
    const vc = (d?.cards || []).filter(isCardValid)
    if (!d?.plan || vc.length === 0) return "Votre brouillon est vide. Reprenez l'étape cartes."
    if (!addr.email || !/.+@.+\..+/.test(addr.email)) return "Email invalide."
    if (!addr.firstName) return "Prénom requis."
    if (!addr.lastName) return "Nom requis."
    if (!addr.line1) return "Adresse requise."
    if (!addr.postalCode) return "Code postal requis."
    if (!addr.city) return "Ville requise."
    if (!addr.country) return "Pays requis."
    return null
  }

  async function submit() {
    // Re-lecture “fraîche” + re-filtrage pour empêcher un vieux brouillon vide
    let d = draft
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) d = JSON.parse(raw)
    } catch {}

    const v = validate(d)
    if (v) { setErr(v); return }

    const sendCards = (d.cards || []).filter(isCardValid)

    setErr(null); setLoading(true)
    try {
      const payload = {
        email: addr.email,
        plan: d.plan,
        cards: sendCards,
        promoCode: d.appliedCoupon || null,
        address: {
          firstName: addr.firstName,
          lastName: addr.lastName,
          company: addr.company || null,
          line1: addr.line1,
          line2: addr.line2 || null,
          postalCode: addr.postalCode,
          city: addr.city,
          country: addr.country,
          phone: addr.phone || null,
          instructions: addr.instructions || null
        }
      }

      const r = await fetch('/api/order/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const raw = await r.text()
      const data = raw ? JSON.parse(raw) : null
      if (!r.ok) throw new Error(data?.error ? `${data.error}${data?.details ? `: ${data.details}` : ''}` : raw)

      // Conserver l’email pour /account
      localStorage.setItem('accountEmail', addr.email)

      // (Optionnel) vider le brouillon après lancement du paiement
      // localStorage.removeItem(STORAGE_KEY)

      window.location.href = data.checkoutUrl
    } catch (e: any) {
      setErr(e?.message || 'SERVER_ERROR')
    } finally {
      setLoading(false)
    }
  }

  // Tant qu’on n’a pas fini de lire le localStorage, on évite un flash
  if (!ready) {
    return (
      <section className="container py-12">
        <div className="card p-6">Chargement…</div>
      </section>
    )
  }

  // Si hasDraft = false, on a déjà lancé la redirection; on peut afficher un fallback court
  if (!hasDraft) {
    return (
      <section className="container py-12">
        <div className="card p-6">
          <div className="text-lg font-semibold mb-1">Redirection…</div>
          <p className="text-muted">Aucune carte détectée dans votre brouillon.</p>
          <div className="mt-4">
            <Link to="/order/new" className="btn-primary">← Retour aux cartes</Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="container py-12 md:pb-12 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Adresse de retour</h1>
        <Link to="/order/new" className="btn-outline">← Modifier mes cartes</Link>
      </div>

      <div className="mt-6 grid md:grid-cols-3 gap-6">
        {/* Form */}
        <div className="md:col-span-2 card p-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted">Email</label>
              <input
                type="email"
                value={addr.email}
                onChange={e => update('email', e.target.value)}
                placeholder="vous@exemple.com"
                className="mt-1 w-full rounded-lg border border-border bg-white dark:bg-slate-900 px-4 py-2"
              />
            </div>
            <div />
            <div>
              <label className="text-sm text-muted">Prénom</label>
              <input
                value={addr.firstName}
                onChange={e => update('firstName', e.target.value)}
                placeholder="Prénom"
                className="mt-1 w-full rounded-lg border border-border bg-white dark:bg-slate-900 px-4 py-2"
              />
            </div>
            <div>
              <label className="text-sm text-muted">Nom</label>
              <input
                value={addr.lastName}
                onChange={e => update('lastName', e.target.value)}
                placeholder="Nom"
                className="mt-1 w-full rounded-lg border border-border bg-white dark:bg-slate-900 px-4 py-2"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-muted">Société (optionnel)</label>
              <input
                value={addr.company}
                onChange={e => update('company', e.target.value)}
                placeholder="Nom de société"
                className="mt-1 w-full rounded-lg border border-border bg-white dark:bg-slate-900 px-4 py-2"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm text-muted">Adresse</label>
              <input
                value={addr.line1}
                onChange={e => update('line1', e.target.value)}
                placeholder="N° et rue"
                className="mt-1 w-full rounded-lg border border-border bg-white dark:bg-slate-900 px-4 py-2"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-muted">Complément (optionnel)</label>
              <input
                value={addr.line2}
                onChange={e => update('line2', e.target.value)}
                placeholder="Bâtiment, app., etc."
                className="mt-1 w-full rounded-lg border border-border bg-white dark:bg-slate-900 px-4 py-2"
              />
            </div>

            <div>
              <label className="text-sm text-muted">Code postal</label>
              <input
                value={addr.postalCode}
                onChange={e => update('postalCode', e.target.value)}
                placeholder="75000"
                className="mt-1 w-full rounded-lg border border-border bg-white dark:bg-slate-900 px-4 py-2"
              />
            </div>
            <div>
              <label className="text-sm text-muted">Ville</label>
              <input
                value={addr.city}
                onChange={e => update('city', e.target.value)}
                placeholder="Paris"
                className="mt-1 w-full rounded-lg border border-border bg-white dark:bg-slate-900 px-4 py-2"
              />
            </div>
            <div>
              <label className="text-sm text-muted">Pays</label>
              <input
                value={addr.country}
                onChange={e => update('country', e.target.value)}
                placeholder="FR"
                className="mt-1 w-full rounded-lg border border-border bg-white dark:bg-slate-900 px-4 py-2"
              />
            </div>
            <div>
              <label className="text-sm text-muted">Téléphone (optionnel)</label>
              <input
                value={addr.phone}
                onChange={e => update('phone', e.target.value)}
                placeholder="+33…"
                className="mt-1 w-full rounded-lg border border-border bg-white dark:bg-slate-900 px-4 py-2"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm text-muted">Instructions (optionnel)</label>
              <textarea
                value={addr.instructions}
                onChange={e => update('instructions', e.target.value)}
                rows={3}
                placeholder="Infos de livraison utiles"
                className="mt-1 w-full rounded-lg border border-border bg-white dark:bg-slate-900 px-4 py-2"
              />
            </div>
          </div>

          {err && <div className="mt-4 text-sm text-red-600 dark:text-red-400">{err}</div>}

          <button type="button" className="btn-primary mt-6" onClick={submit} disabled={loading}>
            {loading ? 'Redirection…' : 'Passer au paiement'}
          </button>
        </div>

        {/* Récap sticky */}
        <aside className="card p-6 h-max md:sticky md:top-24">
          <div className="font-semibold">Récapitulatif</div>
          <div className="mt-3 text-sm space-y-2">
            <div className="flex justify-between"><span>Cartes</span><span>{validCards.length}</span></div>
            <div className="flex justify-between"><span>Formule</span><span>{draft?.plan}</span></div>
            {draft?.appliedCoupon && (
              <div className="flex justify-between text-muted">
                <span>Code promo</span><span>{draft.appliedCoupon}</span>
              </div>
            )}
            <div className="border-t border-border/70 my-2" />
            <div className="flex justify-between font-semibold">
              <span>Total estimé</span><span>{total.toFixed(2)}€</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom bar mobile */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/70 bg-surface/95 dark:bg-slate-950/90 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted">Total estimé</div>
            <div className="text-lg font-semibold">{total.toFixed(2)}€</div>
          </div>
          <button className="btn-primary" onClick={submit} disabled={loading}>
            {loading ? '...' : 'Payer'}
          </button>
        </div>
      </div>
    </section>
  )
}
