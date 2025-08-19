import React, { useImperativeHandle, useRef, forwardRef } from 'react'
import type { Certificate } from '../data/mock'

export type CertificateImageHandle = { exportPNG: (filename?: string) => Promise<string> }

type Population = { total: number; byGrade?: Record<string, number> }

type Props = {
  cert: Certificate
  population?: Population
  qrDataUrl?: string
  width?: number
  height?: number
  watermark?: string
  className?: string
}

const CertificateImage = forwardRef<CertificateImageHandle, Props>(function CertificateImage(
  { cert, population, qrDataUrl, width = 1280, height = 820, watermark = 'VERIFIED CERTIFICATE', className },
  ref
) {
  const svgRef = useRef<SVGSVGElement | null>(null)

  useImperativeHandle(ref, () => ({
    exportPNG: async (filename = `${cert.id}.png`) => {
      const svg = svgRef.current
      if (!svg) throw new Error('SVG not ready')
      const xml = new XMLSerializer().serializeToString(svg)
      const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image(); el.onload = () => resolve(el); el.onerror = reject; el.src = url
      })
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)
      const dataURL = canvas.toDataURL('image/png')
      const a = document.createElement('a'); a.href = dataURL; a.download = filename; document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
      return dataURL
    }
  }), [cert, width, height])

  const pad = 36
  const leftW = 480
  const leftH = height - pad * 2
  const rightX = pad + leftW + 32
  const rightW = width - rightX - pad
  const cardW = leftW - 32
  const cardH = Math.round(cardW * 7 / 5)
  const cardX = pad + 16
  const cardY = pad + 120

  return (
    <svg ref={svgRef} className={className || 'hidden'} xmlns="http://www.w3.org/2000/svg"
      width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f8fafc"/><stop offset="1" stopColor="#eef2ff"/>
        </linearGradient>
        <radialGradient id="glow" cx="0.2" cy="0.1" r="1">
          <stop offset="0" stopColor="#c7d2fe" stopOpacity="0.35"/><stop offset="1" stopColor="#fff" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="medal" x1="0" x2="1"><stop offset="0" stopColor="#6366f1"/><stop offset="1" stopColor="#a78bfa"/></linearGradient>
      </defs>
      <rect x="0" y="0" width={width} height={height} fill="url(#bg1)"/><rect x="0" y="0" width={width} height={height} fill="url(#glow)"/>

      {/* Header */}
      <g>
        <text x={pad} y={64} fill="#0f172a" fontSize="28" fontWeight="800" fontFamily="Inter, system-ui, Arial">VCG Grading</text>
        <text x={pad} y={94} fill="#475569" fontSize="14" fontFamily="Inter, system-ui, Arial">Certified Digital Certificate</text>

        {/* QR en haut à droite (si dispo) */}
        {qrDataUrl ? (
          <image href={qrDataUrl} x={width - pad - 140} y={pad} width="120" height="120" />
        ) : (
          <g transform={`translate(${width - pad - 120}, ${pad})`}>
            <circle cx="60" cy="40" r="34" fill="url(#medal)" opacity="0.12" />
            <circle cx="60" cy="40" r="32" fill="none" stroke="#a78bfa" strokeOpacity="0.35" />
            <text x="60" y="45" textAnchor="middle" fontSize="12" fontWeight="700" fill="#7c3aed" fontFamily="Inter, system-ui, Arial">VCG SEAL</text>
          </g>
        )}
      </g>

      {/* Watermark */}
      <text x={width/2} y={height/2} textAnchor="middle" fill="#0f172a" fontSize="64" fontWeight="800" opacity="0.05"
        fontFamily="Inter, system-ui, Arial" transform={`rotate(-18 ${width/2} ${height/2})`}>{watermark}</text>

      {/* Visuel carte */}
      <g>
        <rect x={pad} y={pad+100} width={leftW} height={leftH-100} rx="20" fill="#fff" stroke="#e2e8f0" />
        <text x={pad+20} y={pad+128} fill="#0f172a" fontSize="16" fontWeight="700" fontFamily="Inter, system-ui, Arial">Card Preview</text>
        <rect x={cardX} y={cardY} width={cardW} height={cardH} rx="16" fill="#f1f5f9" stroke="#e2e8f0" />
        {cert.imageUrl ? (
          <image href={cert.imageUrl} x={cardX+10} y={cardY+10} width={cardW-20} height={cardH-20} preserveAspectRatio="xMidYMid meet" />
        ) : (
          <text x={cardX + cardW/2} y={cardY + cardH/2} textAnchor="middle" fill="#64748b" fontSize="14"
            fontFamily="Inter, system-ui, Arial">No preview</text>
        )}
        <text x={pad+20} y={cardY + cardH + 40} fill="#0f172a" fontSize="18" fontWeight="800" fontFamily="Inter, system-ui, Arial">
          {cert.card.game} — {cert.card.name}</text>
        <text x={pad+20} y={cardY + cardH + 66} fill="#475569" fontSize="14" fontFamily="Inter, system-ui, Arial">
          {cert.card.set} {cert.card.number}, {cert.card.year}</text>
      </g>

      {/* Panneau droit */}
      <g>
        <rect x={rightX} y={pad+100} width={rightW} height={leftH-100} rx="20" fill="#fff" stroke="#e2e8f0" />
        <circle cx={rightX + 64} cy={pad + 164} r={52} fill="url(#medal)" />
        <text x={rightX + 64} y={pad + 172} textAnchor="middle" fontSize="36" fontWeight="900" fill="#fff"
          fontFamily="Inter, system-ui, Arial">{String(cert.grade)}</text>
        <text x={rightX + 130} y={pad + 152} fill="#0f172a" fontSize="20" fontWeight="800" fontFamily="Inter, system-ui, Arial">Certified Grade</text>
        <text x={rightX + 130} y={pad + 176} fill="#475569" fontSize="13" fontFamily="Inter, system-ui, Arial">Unique ID & traceability</text>

        {[
          ['ID', cert.id],
          ['Serial', cert.serial],
          ['Issued on', new Date(cert.date).toLocaleDateString()],
        ].map(([k, v], i) => (
          <g key={String(k)}>
            <text x={rightX + 24} y={pad + 220 + i*44} fill="#64748b" fontSize="12" fontFamily="Inter, system-ui, Arial">{String(k)}</text>
            <text x={rightX + 24} y={pad + 240 + i*44} fill="#0f172a" fontSize="16" fontWeight="700" fontFamily="Inter, system-ui, Arial">{String(v)}</text>
          </g>
        ))}

        {cert.subgrades && (
          <g>
            <text x={rightX + 24} y={pad + 370} fill="#64748b" fontSize="12" fontFamily="Inter, system-ui, Arial">Subgrades</text>
            {[
              ['Surface', cert.subgrades.surface],
              ['Edges', cert.subgrades.edges],
              ['Centering', cert.subgrades.centering],
              ['Corners', cert.subgrades.corners],
            ].map(([label, val], i) => {
              const col = i % 2, row = Math.floor(i / 2)
              const boxW = (rightW - 24*2 - 16) / 2, boxH = 66
              const x = rightX + 24 + col * (boxW + 16)
              const y = pad + 388 + row * (boxH + 12)
              return (
                <g key={String(label)}>
                  <rect x={x} y={y} width={boxW} height={boxH} rx="10" fill="#f8fafc" stroke="#e2e8f0" />
                  <text x={x + 12} y={y + 24} fill="#64748b" fontSize="11" fontFamily="Inter, system-ui, Arial">{String(label)}</text>
                  <text x={x + 12} y={y + 46} fill="#0f172a" fontSize="18" fontWeight="800" fontFamily="Inter, system-ui, Arial">{String(val)}</text>
                </g>
              )
            })}
          </g>
        )}

        {population && (
          <g>
            <text x={rightX + 24} y={pad + 540} fill="#64748b" fontSize="12" fontFamily="Inter, system-ui, Arial">Population</text>
            <text x={rightX + 24} y={pad + 560} fill="#0f172a" fontSize="16" fontWeight="800" fontFamily="Inter, system-ui, Arial">
              Total: {population.total || 0}
            </text>
            {population.byGrade && Object.keys(population.byGrade).length > 0 && (
              Object.entries(population.byGrade).slice(0, 5).map(([g, n], i) => (
                <text key={g} x={rightX + 24} y={pad + 586 + i*22} fill="#475569" fontSize="13" fontFamily="Inter, system-ui, Arial">
                  Grade {g}: {n}
                </text>
              ))
            )}
          </g>
        )}
      </g>

      <text x={pad} y={height - 20} fill="#94a3b8" fontSize="12" fontFamily="Inter, system-ui, Arial">
        © {new Date().getFullYear()} VCG Grading — vcggrading.com
      </text>
    </svg>
  )
})

export default CertificateImage
