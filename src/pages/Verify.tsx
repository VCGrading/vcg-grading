import { useParams, useNavigate, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { mockCertificates, type Certificate } from '../data/mock'
import { useI18n } from '../i18n'

export default function Verify() {
  const { t } = useI18n()
  const params = useParams()
  const navigate = useNavigate()
  const [query, setQuery] = useState(params.certId ?? '')
  const [result, setResult] = useState<Certificate | null>(null)

  // charge un certificat quand l'ID dans l'URL change
  useEffect(() => {
    if (!params.certId) {
      setResult(null)
      setQuery('') // reset l'input si on arrive sans id
      return
    }

    const id = params.certId
    const ctrl = new AbortController()
    let cancelled = false

    ;(async () => {
      try {
        const r = await fetch(`/api/verify/${encodeURIComponent(id)}`, { signal: ctrl.signal })

        if (r.ok) {
          const data: Certificate = await r.json()
          if (!cancelled) setResult(data)
          return
        }

        // 404 ou autre statut -> on tente un fallback local (utile en dev)
        const mock = mockCertificates.find(c => c.id === id || c.serial === id) || null
        if (!cancelled) setResult(mock)
      } catch {
        // erreur réseau/abort -> fallback mock
        const mock = mockCertificates.find(c => c.id === id || c.serial === id) || null
        if (!cancelled) setResult(mock)
      }
    })()

    return () => {
      cancelled = true
      ctrl.abort()
    }
  }, [params.certId])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    navigate(`/verify/${encodeURIComponent(query.trim())}`)
  }

  const shareOrCopy = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: result ? `${result.id} — ${result.card.name}` : 'VCG Grading', url })
      } else {
        await navigator.clipboard.writeText(url)
        alert(t('verify.copied'))
      }
    } catch {}
  }

  return (
    <section className="container py-12">
      <h1 className="text-2xl md:text-3xl font-bold">{t('verify.title')}</h1>

      <form onSubmit={submit} className="mt-6 flex gap-3 max-w-xl">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('verify.placeholder')}
          className="flex-1 rounded-lg border border-border bg-white dark:bg-slate-900 px-4 py-2 outline-none"
        />
        <button className="btn-primary">{t('verify.btn')}</button>
      </form>

      {result ? (
        <div className="card p-6 mt-8 grid md:grid-cols-2 gap-6">
          <div className="aspect-[4/3] rounded-lg bg-slate-100 dark:bg-slate-800 grid place-items-center">
            <div className="text-6xl">🪪</div>
          </div>
          <div className="text-sm">
            <div className="text-xs text-muted">{t('verify.id')}</div>
            <div className="font-mono">{result.id}</div>

            <div className="mt-3 text-xs text-muted">{t('verify.serial')}</div>
            <div className="font-mono">{result.serial}</div>

            <div className="mt-3 text-xs text-muted">{t('verify.card')}</div>
            <div>{result.card.game} — {result.card.name} ({result.card.set} {result.card.number}, {result.card.year})</div>

            <div className="mt-3 text-xs text-muted">{t('verify.grade')}</div>
            <div className="text-2xl font-bold">{result.grade}</div>

            <div className="mt-3 text-xs text-muted">{t('verify.date')}</div>
            <div>{new Date(result.date).toLocaleDateString()}</div>

            {/* Subgrades si présents */}
            {result.subgrades && (
              <div className="mt-4">
                <div className="text-xs text-muted">{t('cert.subgrades')}</div>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="rounded-md border border-border/70 px-2 py-2">
                    <div className="text-[11px] text-muted">{t('cert.sub.surface')}</div>
                    <div className="font-mono font-semibold">{result.subgrades.surface}</div>
                  </div>
                  <div className="rounded-md border border-border/70 px-2 py-2">
                    <div className="text-[11px] text-muted">{t('cert.sub.edges')}</div>
                    <div className="font-mono font-semibold">{result.subgrades.edges}</div>
                  </div>
                  <div className="rounded-md border border-border/70 px-2 py-2">
                    <div className="text-[11px] text-muted">{t('cert.sub.centering')}</div>
                    <div className="font-mono font-semibold">{result.subgrades.centering}</div>
                  </div>
                  <div className="rounded-md border border-border/70 px-2 py-2">
                    <div className="text-[11px] text-muted">{t('cert.sub.corners')}</div>
                    <div className="font-mono font-semibold">{result.subgrades.corners}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="btn-outline" onClick={shareOrCopy}>
                {t('verify.share')}
              </button>
              <Link to={`/cert/${encodeURIComponent(result.id)}`} className="btn-primary">
                {t('cert.openPublic')}
              </Link>
            </div>
          </div>
        </div>
      ) : params.certId ? (
        <div className="mt-8 text-muted">{t('verify.none')}</div>
      ) : null}
    </section>
  )
}
