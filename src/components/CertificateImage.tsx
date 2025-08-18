import React, { useMemo } from 'react'
import type { Certificate } from '../data/mock'
import { useI18n } from '../i18n'
import QR from './QR'

export default function CertificateImage({ cert, watermarkText = 'VCG GRADING — VERIFIED' }: { cert: Certificate; watermarkText?: string }) {
  const { t } = useI18n()
  const lineText = useMemo(() => Array(6).fill(watermarkText.toUpperCase()).join(' • '), [watermarkText])

  return (
    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-black">
      {/* Watermark en arrière-plan */}
      <div className="absolute inset-0 pointer-events-none" style={{ transform: 'rotate(-20deg)' }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="absolute w-[220%] left-[-60%] text-center select-none uppercase font-extrabold tracking-widest"
               style={{ top: `${i * 16}%`, opacity: 0.05 }}>
            {lineText}
          </div>
        ))}
      </div>

      {/* Layout interne */}
      <div className="absolute inset-0 z-10 flex flex-col p-4 gap-3">
        {/* SLAB */}
        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur px-4 py-2 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-brand shadow-inner" aria-hidden />
            <div className="leading-tight">
              <div className="font-semibold tracking-wide">VCG Grading</div>
              <div className="text-[11px] text-muted/80">{cert.id} • {cert.serial}</div>
            </div>
          </div>
          <div className="h-12 w-12 rounded-full grid place-items-center bg-gradient-to-br from-white to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-white/60 dark:border-white/10 shadow">
            <div className="text-lg font-extrabold">{cert.grade}</div>
          </div>
        </div>

        {/* Zone centrale : viewport 5/7, image en object-contain */}
        <div className="flex-1 grid place-items-center px-4">
          <div className="relative aspect-[5/7] h-full max-h-[520px] w-auto rounded-lg bg-white dark:bg-slate-900 shadow-xl ring-1 ring-black/5 overflow-hidden">
            {cert.imageUrl ? (
              <img src={cert.imageUrl} alt={cert.card.name} className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full grid place-items-center text-7xl">🃏</div>
            )}
          </div>
        </div>

        {/* Subgrades + QR, hors de l’image */}
        <div className="flex items-center justify-between gap-3">
          {cert.subgrades ? (
            <div className="flex flex-wrap gap-2">
              <Chip label={t('cert.sub.surface')} value={cert.subgrades.surface} />
              <Chip label={t('cert.sub.edges')} value={cert.subgrades.edges} />
              <Chip label={t('cert.sub.centering')} value={cert.subgrades.centering} />
              <Chip label={t('cert.sub.corners')} value={cert.subgrades.corners} />
            </div>
          ) : <div />}

          {cert.qrUrl && (
            <div className="rounded-lg border border-black/10 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 p-2">
              <QR text={cert.qrUrl} size={72} />
            </div>
          )}
        </div>

        {/* Micro-texte */}
        <div className="text-center text-[10px] font-mono tracking-[.25em] uppercase text-slate-600/70 dark:text-slate-300/60">
          {Array(6).fill(`${cert.id} • ${cert.serial} • ${cert.card.name}`).join('   ')}
        </div>
      </div>
    </div>
  )
}

function Chip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-white/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur px-2 py-1 text-xs shadow-sm">
      <span className="text-muted">{label}:</span> <span className="font-semibold">{value}</span>
    </div>
  )
}
