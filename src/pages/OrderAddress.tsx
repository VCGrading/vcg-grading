import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n'

type Address = {
  firstName: string
  lastName: string
  address1: string
  address2: string
  postalCode: string
  city: string
  country: string
  phone: string
  instructions: string
  saveDefault: boolean
}

const EMPTY: Address = {
  firstName: '',
  lastName: '',
  address1: '',
  address2: '',
  postalCode: '',
  city: '',
  country: 'FR',
  phone: '',
  instructions: '',
  saveDefault: true
}

const STORAGE_SHIP = 'shippingAddress'
const STORAGE_DEFAULT = 'defaultAddress'

export default function OrderAddress() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [model, setModel] = useState<Address>({ ...EMPTY })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_SHIP)
    if (raw) {
      try { setModel({ ...EMPTY, ...JSON.parse(raw) }) } catch {}
    }
  }, [])

  const useSaved = () => {
    const raw = localStorage.getItem(STORAGE_DEFAULT)
    if (!raw) return
    try { setModel({ ...EMPTY, ...JSON.parse(raw) }) } catch {}
  }

  const onChange = (k: keyof Address, v: string | boolean) => {
    setModel(prev => ({ ...prev, [k]: v }))
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!model.firstName.trim()) e.firstName = t('addr.err.required')
    if (!model.lastName.trim()) e.lastName = t('addr.err.required')
    if (!model.address1.trim()) e.address1 = t('addr.err.required')
    if (!model.postalCode.trim()) e.postalCode = t('addr.err.required')
    if (!model.city.trim()) e.city = t('addr.err.required')
    if (!model.country.trim()) e.country = t('addr.err.required')
    if (model.phone && !/^[+0-9()\-.\s]{6,}$/.test(model.phone)) e.phone = t('addr.err.phone')
    if (model.country === 'FR' && model.postalCode && !/^\d{5}$/.test(model.postalCode)) {
      e.postalCode = t('addr.err.postal')
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    localStorage.setItem(STORAGE_SHIP, JSON.stringify(model))
    if (model.saveDefault) {
      localStorage.setItem(STORAGE_DEFAULT, JSON.stringify(model))
    }
    navigate('/orders/ORD-1003') // prochaine étape (mock)
  }

  return (
    <section className="container py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">{t('addr.title')}</h1>
        <button className="btn-outline" onClick={() => navigate(-1)}>{t('addr.back')}</button>
      </div>

      <form className="mt-6 grid md:grid-cols-3 gap-6" onSubmit={submit}>
        <div className="md:col-span-2 card p-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted">{t('addr.firstName')}</label>
              <input
                value={model.firstName}
                onChange={e => onChange('firstName', e.target.value)}
                className={'mt-1 w-full rounded-lg border px-4 py-2 ' + (errors.firstName ? 'border-red-500' : 'border-border bg-white dark:bg-slate-900')}
                placeholder="Votre prénom"
              />
              {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <label className="text-sm text-muted">{t('addr.lastName')}</label>
              <input
                value={model.lastName}
                onChange={e => onChange('lastName', e.target.value)}
                className={'mt-1 w-full rounded-lg border px-4 py-2 ' + (errors.lastName ? 'border-red-500' : 'border-border bg-white dark:bg-slate-900')}
                placeholder="Votre nom"
              />
              {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm text-muted">{t('addr.address1')}</label>
              <input
                value={model.address1}
                onChange={e => onChange('address1', e.target.value)}
                className={'mt-1 w-full rounded-lg border px-4 py-2 ' + (errors.address1 ? 'border-red-500' : 'border-border bg-white dark:bg-slate-900')}
                placeholder="123 rue Exemple"
              />
              {errors.address1 && <p className="text-xs text-red-500 mt-1">{errors.address1}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm text-muted">{t('addr.address2')} <span className="text-xs text-muted">({t('addr.optional')})</span></label>
              <input
                value={model.address2}
                onChange={e => onChange('address2', e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-4 py-2 bg-white dark:bg-slate-900"
                placeholder="Appartement, bâtiment, etc."
              />
            </div>

            <div>
              <label className="text-sm text-muted">{t('addr.postalCode')}</label>
              <input
                value={model.postalCode}
                onChange={e => onChange('postalCode', e.target.value)}
                className={'mt-1 w-full rounded-lg border px-4 py-2 ' + (errors.postalCode ? 'border-red-500' : 'border-border bg-white dark:bg-slate-900')}
                placeholder="75001"
                inputMode="numeric"
              />
              {errors.postalCode && <p className="text-xs text-red-500 mt-1">{errors.postalCode}</p>}
            </div>
            <div>
              <label className="text-sm text-muted">{t('addr.city')}</label>
              <input
                value={model.city}
                onChange={e => onChange('city', e.target.value)}
                className={'mt-1 w-full rounded-lg border px-4 py-2 ' + (errors.city ? 'border-red-500' : 'border-border bg-white dark:bg-slate-900')}
                placeholder="Paris"
              />
              {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
            </div>

            <div>
              <label className="text-sm text-muted">{t('addr.country')}</label>
              <select
                value={model.country}
                onChange={e => onChange('country', e.target.value)}
                className={'mt-1 w-full rounded-lg border px-4 py-2 ' + (errors.country ? 'border-red-500' : 'border-border bg-white dark:bg-slate-900')}
              >
                {['FR','BE','CH','DE','ES','IT','GB','US'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.country && <p className="text-xs text-red-500 mt-1">{errors.country}</p>}
            </div>
            <div>
              <label className="text-sm text-muted">{t('addr.phone')}</label>
              <input
                value={model.phone}
                onChange={e => onChange('phone', e.target.value)}
                className={'mt-1 w-full rounded-lg border px-4 py-2 ' + (errors.phone ? 'border-red-500' : 'border-border bg-white dark:bg-slate-900')}
                placeholder="+33 6 00 00 00 00"
                inputMode="tel"
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm text-muted">{t('addr.instructions')} <span className="text-xs text-muted">({t('addr.optional')})</span></label>
              <textarea
                value={model.instructions}
                onChange={e => onChange('instructions', e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-border px-4 py-2 bg-white dark:bg-slate-900"
                placeholder="Instructions de livraison (digicode, horaires, ...)"
              />
            </div>

            <label className="sm:col-span-2 inline-flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={model.saveDefault}
                onChange={e => onChange('saveDefault', e.target.checked)}
              />
              <span className="text-sm">{t('addr.saveDefault')}</span>
            </label>
          </div>
        </div>

        <aside className="card p-6 h-max">
          <div className="font-semibold">{t('addr.sidebar.title')}</div>
          <p className="text-sm text-muted mt-2">{t('addr.sidebar.desc')}</p>

          <div className="mt-4 flex gap-2">
            <button type="button" className="btn-outline" onClick={useSaved}>
              {t('addr.useSaved')}
            </button>
            <button type="submit" className="btn-primary">
              {t('addr.continue')}
            </button>
          </div>

          <div className="mt-6 text-xs text-muted">
            {t('addr.note')}
          </div>
        </aside>
      </form>
    </section>
  )
}
