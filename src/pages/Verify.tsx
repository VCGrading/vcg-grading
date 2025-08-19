import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { mockCertificates, type Certificate } from '../data/mock'
import { useI18n } from '../i18n'
import CertificateImage, { type CertificateImageHandle } from '../components/CertificateImage'

type Pop = { total: number; byGrade?: Record<string, number> }

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-0.5">{children}</div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="card p-6 mt-8 grid md:grid-cols-2 gap-6">
      <div className="aspect-[4/3] rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
      <div className="space-y-3">
        <div className="h-6 w-40 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-4 w-64 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 rounded-md bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Verify() {
  const { t } = useI18n()
  const params = useParams()
  const navigate = useNavigate()

  const [query, setQuery] = useState(params.certId ?? '')
  const [result, setResult] = useState<Certificate | null>(null)
  const [loading, setLoading] = useState(false)
  const [pop, setPop] = useState<Pop | null>(null)
  const [popLoading, setPopLoading] = useState(false)

  const imgRef = useRef<CertificateImageHandle | null>(null)

  // Charge un certificat à chaque changement d'ID
  useEffect(() => {
    const id = params.certId
    if (!id) {
      setResult(null)
      setQuery('')
      setPop(null)
      setLoading(false)
      return
    }

    const ctrl = new AbortController()
    let cancelled = false
    setLoading(true)
    setPop(null)

    ;(async () => {
      try {
        const r = await fetch(`/api/verify/${encodeURIComponent(id)}`, { signal: ctrl.signal })
        if (r.ok) {
          const data: Certificate = await r.json()
          if (!cancelled) setResult(data)
        } else {
          const mock = mockCertificates.find(c => c.id === id || c.serial === id) || null
          if (!cancelled) setResult(mock)
        }
      } catch {
        const mock = mockCertificates.find(c => c.id === id || c.serial === id) || null
        if (!cancelled) setResult(mock)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
      ctrl.abort()
    }
  }, [params.certId])

  // Quand on a le cert, on récupère la population
  useEffect(() => {
    if (!result) return
    if (!result.card?.name || !result.card?.set || !result.card?.number || !result.card?.year) return

    const q = new URLSearchParams({
      name: String(result.card.name),
      set: String(result.card.set),
      number: String(result.card.number),
      year: String(result.card.year),
    }).toString()

    setPopLoading(true)
    fetch(`/api/population?${q}`)
      .then(async r => {
        const raw = await r.text()
        const data = raw ? JSON.parse(raw) : null
        if (!r.ok) throw new Error(data?.error || raw)
        setPop({ total: data.total || 0, byGrade: data.byGrade || {} })
      })
      .catch(() => setPop(null))
      .finally(() => setPopLoading(false))
  }, [result])

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

  const downloadPng = async () => {
    try {
      await imgRef.current?.exportPNG(`${result?.id || 'certificate'}.png`)
    } catch {
      // silencieux
    }
  }

  return (
    <section className="py-0">
      {/* Hero premium */}
      <div className="relative overflow-hidden bg-gradient-to-b from-indigo-600/10 via-transparent to-transparent dark:from-indigo-500/10">
        <div className="container py-12 md:py-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/60 dark:border-indigo-900/50 bg-white/60 dark:bg-slate-900/40 px-3 py-1 backdrop-blur">
              <span className="i-lucide-shield-check h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">VCG</span>
              <span className="text-xs text-muted">Trust & Verification</span>
            </div>
            <h1 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
              {t('verify.title')}
            </h1>
            <p className="mt-2 text-muted max-w-2xl">
              {t('landing.why.item2.desc')}
            </p>

            {/* Barre de recherche */}
            <form onSubmit={submit} className="mt-6 max-w-2xl">
              <div className="flex items-stretch gap-3 rounded-xl border border-border bg-surface p-2 shadow-sm">
                <div className="flex-1">
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder={t('verify.placeholder')}
                    className="w-full bg-transparent px-3 py-2 outline-none"
                  />
                  <div className="px-3 pb-1 text-[11px] text-muted">
                    ex: <code className="font-mono">CERT-VCG-0001</code> ou <code className="font-mono">NG-0001</code>
                  </div>
                </div>
                <button className="btn-primary self-center">{t('verify.btn')}</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="container pb-12">
        {loading && <SkeletonCard />}

        {!loading && result && (
          <div className="card p-6 mt-8 grid md:grid-cols-[1.1fr_1fr] gap-6">
            {/* Bloc visuel + infos carte */}
            <div className="relative rounded-xl border border-border/70 overflow-hidden">
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.08),transparent_60%)]" />
              <div className="grid md:grid-cols-2">
                <div className="p-4">
                  <div className="rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-[5/7] grid place-items-center">
                    {result.imageUrl ? (
                      <img src={result.imageUrl} alt={result.card.name} className="h-full w-full object-contain" />
                    ) : (
                      <div className="text-center text-muted">
                        <div className="text-6xl">🃏</div>
                        <div className="text-xs mt-1">No preview</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Grade + subgrades + population */}
                <div className="p-4 flex flex-col">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white grid place-items-center text-2xl font-bold shadow">
                      {result.grade}
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        {result.card.game} — {result.card.name}
                      </div>
                      <div className="text-sm text-muted">
                        {result.card.set} {result.card.number}, {result.card.year}
                      </div>
                    </div>
                  </div>

                  {result.subgrades && (
                    <div className="mt-4">
                      <div className="text-[11px] uppercase tracking-wide text-muted">{t('cert.subgrades')}</div>
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

                  {/* Population */}
                  <div className="mt-5">
                    <div className="text-[11px] uppercase tracking-wide text-muted">Population</div>
                    {popLoading ? (
                      <div className="mt-2 h-14 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                    ) : pop && (pop.total > 0 || (pop.byGrade && Object.keys(pop.byGrade).length > 0)) ? (
                      <>
                        <div className="mt-2 inline-flex items-center rounded-full border border-border bg-white dark:bg-slate-900 px-3 py-1 text-sm">
                          Total: <b className="ml-1">{pop.total}</b>
                        </div>
                        {pop.byGrade && (
                          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                            {Object.entries(pop.byGrade).slice(0, 6).map(([g, n]) => (
                              <div key={g} className="rounded-md border border-border/70 px-2 py-2 flex items-center justify-between">
                                <span className="text-muted">G {g}</span>
                                <span className="font-mono font-semibold">{n}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="mt-2 text-sm text-muted">Aucune donnée de population pour l’instant.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Meta + actions */}
            <div className="text-sm">
              <MetaRow label={t('verify.id')}>
                <div className="font-mono">{result.id}</div>
              </MetaRow>
              <MetaRow label={t('verify.serial')}>
                <div className="font-mono">{result.serial}</div>
              </MetaRow>
              <MetaRow label={t('verify.grade')}>
                <div className="text-2xl font-bold">{result.grade}</div>
              </MetaRow>
              <MetaRow label={t('verify.date')}>
                <div>{new Date(result.date).toLocaleDateString()}</div>
              </MetaRow>

              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" className="btn-outline" onClick={shareOrCopy}>
                  {t('verify.share')}
                </button>
                <button type="button" className="btn-primary" onClick={downloadPng}>
                  {t('cert.download')}
                </button>
              </div>

              <div className="mt-4 text-xs text-muted">
                PNG généré localement. (Le QR peut être ajouté côté serveur plus tard)
              </div>
            </div>
          </div>
        )}

        {!loading && !result && params.certId ? (
          <div className="card p-6 mt-8">
            <div className="text-lg font-semibold mb-1">{t('verify.none')}</div>
            <p className="text-muted">Vérifie l’identifiant ou le numéro puis réessaie.</p>
          </div>
        ) : null}
      </div>

      {/* Générateur PNG hors-écran */}
      {result && (
        <CertificateImage
          ref={imgRef}
          cert={result}
          population={pop || undefined}
          watermark={t('cert.watermark') || 'VERIFIED CERTIFICATE'}
          className="hidden"
        />
      )}
    </section>
  )
}
