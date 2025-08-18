import { useI18n } from '../i18n'

export default function LanguageToggle() {
  const { lang, setLang } = useI18n()
  return (
    <div className="inline-flex items-center gap-1 border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setLang('fr')}
        className={`px-3 py-2 text-sm ${lang === 'fr' ? 'bg-brand text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        aria-pressed={lang === 'fr'}
      >
        FR
      </button>
      <button
        onClick={() => setLang('en')}
        className={`px-3 py-2 text-sm ${lang === 'en' ? 'bg-brand text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        aria-pressed={lang === 'en'}
      >
        EN
      </button>
    </div>
  )
}
