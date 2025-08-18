import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'
import fr from './fr'
import en from './en'

type Lang = 'fr' | 'en'
type Dict = Record<string, string>

type Ctx = {
  lang: Lang
  t: (key: string, vars?: Record<string, string | number>) => string
  setLang: (l: Lang) => void
}

const I18nContext = createContext<Ctx | null>(null)

const DICTS: Record<Lang, Dict> = { fr, en }

function format(str: string, vars?: Record<string, string | number>) {
  if (!vars) return str
  return Object.keys(vars).reduce(
    (acc, k) => acc.replace(new RegExp(`{${k}}`, 'g'), String(vars[k])),
    str
  )
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('lang') as Lang) || 'fr')

  useEffect(() => {
    localStorage.setItem('lang', lang)
    document.documentElement.setAttribute('lang', lang)
  }, [lang])

  const ctx = useMemo<Ctx>(() => ({
    lang,
    setLang,
    t: (key, vars) => {
      const dict = DICTS[lang]
      const msg = dict[key] ?? key
      return format(msg, vars)
    }
  }), [lang])

  return <I18nContext.Provider value={ctx}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}
