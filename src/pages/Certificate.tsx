import { useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { mockCertificates, type Certificate } from '../data/mock'
import { useI18n } from '../i18n'
import CertificateImage from '../components/CertificateImage'

export default function CertificatePage() {
  const { t } = useI18n()
  const { certId } = useParams()

  const cert: Certificate | null = useMemo(() => {
    if (!certId) return null
    return mockCertificates.find(c => c.id === certId || c.serial === certId) ?? null
  }, [certId])

  useEffect(() => {
    document.title = cert ? `${t('brand.name')} — ${cert.id}` : `${t('brand.name')} — ${t('cert.title')}`
  }, [cert, t])

  async function downloadPng() {
    if (!cert) return
    const W = 1400, H = 950
    const canvas = document.createElement('canvas')
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')!

    // fond + grille + halo
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#f8fafc'); g.addColorStop(1, '#e2e8f0')
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = 'rgba(0,0,0,0.05)'; ctx.lineWidth = 1
    for (let x = 50; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke() }
    for (let y = 50; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke() }
    const g2 = ctx.createLinearGradient(0, 0, W, 0)
    g2.addColorStop(0.0, 'rgba(255,0,153,0.10)'); g2.addColorStop(0.3, 'rgba(0,153,255,0.10)')
    g2.addColorStop(0.6, 'rgba(0,255,204,0.10)'); g2.addColorStop(1.0, 'rgba(255,255,0,0.10)')
    ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H)

    // slab
    const slabX = 40, slabY = 30, slabW = W - 80, slabH = 80
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.strokeStyle = 'rgba(0,0,0,0.08)'
    roundRect(ctx, slabX, slabY, slabW, slabH, 14, true, true)
    ctx.fillStyle = '#0f172a'; ctx.font = 'bold 28px sans-serif'
    ctx.fillText('VCG Grading', slabX + 70, slabY + 50)
    ctx.fillStyle = '#0f172a'; ctx.fillRect(slabX + 24, slabY + 24, 32, 32)
    ctx.fillStyle = '#64748b'; ctx.font = '12px sans-serif'
    ctx.fillText(`${cert.id} • ${cert.serial}`, slabX + 70, slabY + 70)

    // badge grade
    const gbx = slabX + slabW - 56, gby = slabY + slabH/2
    ctx.beginPath(); ctx.arc(gbx, gby, 26, 0, Math.PI*2); ctx.closePath()
    const gb = ctx.createLinearGradient(gbx-26, gby-26, gbx+26, gby+26)
    gb.addColorStop(0,'#ffffff'); gb.addColorStop(1,'#e2e8f0')
    ctx.fillStyle = gb; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.stroke()
    ctx.fillStyle = '#0f172a'; ctx.font = 'bold 20px sans-serif'
    const gradeStr = String(cert.grade); const m = ctx.measureText(gradeStr)
    ctx.fillText(gradeStr, gbx - m.width/2, gby + 8)

    // zone visuelle 4/3 + viewport 5/7
    const areaX = 60, areaY = 140, areaW = 760, areaH = 520
    ctx.fillStyle = '#eef2ff'; roundRect(ctx, areaX-12, areaY-12, areaW+24, areaH+24, 16, true, false)
    // viewport 5/7 centré
    const vw = Math.min(areaW, areaH * (5/7)), vh = vw * (7/5)
    const vx = areaX + (areaW - vw)/2, vy = areaY + (areaH - vh)/2

    await drawCardImage(ctx, cert.imageUrl, vx, vy, vw, vh)

    // watermark
    const wm = `${t('brand.name').toUpperCase()} — ${t('cert.watermark')}`
    ctx.save(); ctx.translate(W/2, H/2); ctx.rotate(-20 * Math.PI/180)
    ctx.fillStyle = 'rgba(31,41,55,0.06)'; ctx.font = 'bold 36px sans-serif'
    for (let y = -H; y <= H; y += 120) ctx.fillText(Array(5).fill(wm).join(' • '), -W, y)
    ctx.restore()

    // infos
    ctx.fillStyle = '#0f172a'; ctx.font = 'bold 36px sans-serif'
    ctx.fillText(t('cert.title'), 860, 180)
    ctx.font = '16px sans-serif'
    info(ctx, t('verify.id'), cert.id, 860, 230)
    info(ctx, t('verify.serial'), cert.serial, 860, 280)
    info(ctx, t('verify.card'), `${cert.card.game} — ${cert.card.name} (${cert.card.set} ${cert.card.number}, ${cert.card.year})`, 860, 330, 460)
    info(ctx, t('verify.grade'), String(cert.grade), 860, 420)

    if (cert.subgrades) {
      let y = 470
      ctx.font = 'bold 18px sans-serif'; ctx.fillText(t('cert.subgrades'), 860, y); y += 30
      ctx.font = '16px sans-serif'
      info(ctx, t('cert.sub.surface'), String(cert.subgrades.surface), 860, y); y += 40
      info(ctx, t('cert.sub.edges'), String(cert.subgrades.edges), 860, y); y += 40
      info(ctx, t('cert.sub.centering'), String(cert.subgrades.centering), 860, y); y += 40
      info(ctx, t('cert.sub.corners'), String(cert.subgrades.corners), 860, y); y += 20
    }

    ctx.fillStyle = 'rgba(100,116,139,.8)'; ctx.font = '10px monospace'
    ctx.fillText(Array(12).fill(`${cert.id} • ${cert.serial} • ${cert.card.name}`).join('   '), 60, 820)

    await drawQrOrPlaceholder(ctx, 860, 740, 120, cert.qrUrl || window.location.href)

    // export
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a'); a.href = url; a.download = `${cert.id}.png`; a.click()
  }

  if (!cert) return <section className="container py-12">{t('cert.notFound')}</section>

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: `${cert.id} — ${cert.card.name}`, url: window.location.href })
      else { await navigator.clipboard.writeText(window.location.href); alert(t('verify.copied')) }
    } catch {}
  }

  return (
    <section className="container py-12">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-bold">{t('cert.title')} — {cert.id}</h1>
        <Link to={`/verify/${encodeURIComponent(cert.id)}`} className="btn-outline">{t('nav.verify')}</Link>
      </div>

      <div className="mt-6 grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <CertificateImage cert={cert} watermarkText={`${t('brand.name')} — ${t('cert.watermark')}`} />
        </div>

        <div className="card p-6 text-sm">
          <div className="grid grid-cols-1 gap-4">
            <div><div className="text-xs text-muted">{t('verify.id')}</div><div className="font-mono">{cert.id}</div></div>
            <div><div className="text-xs text-muted">{t('verify.serial')}</div><div className="font-mono">{cert.serial}</div></div>
            <div><div className="text-xs text-muted">{t('verify.card')}</div>
              <div>{cert.card.game} — {cert.card.name} ({cert.card.set} {cert.card.number}, {cert.card.year})</div>
            </div>
            <div><div className="text-xs text-muted">{t('verify.grade')}</div><div className="text-2xl font-bold">{cert.grade}</div></div>
            {cert.subgrades && (
              <div>
                <div className="text-xs text-muted">{t('cert.subgrades')}</div>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Tile label={t('cert.sub.surface')} value={cert.subgrades.surface} />
                  <Tile label={t('cert.sub.edges')} value={cert.subgrades.edges} />
                  <Tile label={t('cert.sub.centering')} value={cert.subgrades.centering} />
                  <Tile label={t('cert.sub.corners')} value={cert.subgrades.corners} />
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button className="btn-outline" onClick={share}>{t('verify.share')}</button>
            <button className="btn-primary" onClick={downloadPng}>{t('cert.download')}</button>
          </div>
        </div>
      </div>
    </section>
  )
}

/* helpers */
function roundRect(ctx: CanvasRenderingContext2D, x:number,y:number,w:number,h:number,r:number, fill=true, stroke=false) {
  const rr = Math.min(r, w/2, h/2)
  ctx.beginPath(); ctx.moveTo(x+rr, y)
  ctx.arcTo(x+w, y,   x+w, y+h, rr)
  ctx.arcTo(x+w, y+h, x,   y+h, rr)
  ctx.arcTo(x,   y+h, x,   y,   rr)
  ctx.arcTo(x,   y,   x+w, y,   rr)
  ctx.closePath(); if (fill) ctx.fill(); if (stroke) ctx.stroke()
}
function info(ctx:CanvasRenderingContext2D,label:string,value:string,x:number,y:number,maxWidth?:number){
  ctx.fillStyle = '#64748b'; ctx.fillText(label.toUpperCase(), x, y)
  ctx.fillStyle = '#0f172a'
  if (!maxWidth) { ctx.fillText(value, x, y+22); return }
  const words = value.split(' '); let line = '', yy = y + 22
  for (const w of words) { const t = line + w + ' '; if (ctx.measureText(t).width > maxWidth) { ctx.fillText(line, x, yy); line = w + ' '; yy += 22 } else line = t }
  if (line) ctx.fillText(line, x, yy)
}
async function drawQrOrPlaceholder(ctx:CanvasRenderingContext2D,x:number,y:number,size:number,text:string){
  try {
    const mod = await import('qrcode')
    const dataUrl = await mod.toDataURL(text, { margin: 0, width: size })
    await new Promise<void>((resolve) => { const img = new Image(); img.onload = () => { ctx.drawImage(img, x, y, size, size); resolve() }; img.onerror = () => resolve(); img.src = dataUrl })
  } catch {
    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2; ctx.strokeRect(x, y, size, size)
    ctx.font = '12px monospace'; ctx.fillStyle = '#334155'; const m = ctx.measureText('QR'); ctx.fillText('QR', x + size/2 - m.width/2, y + size/2 + 4)
  }
}
async function drawCardImage(ctx:CanvasRenderingContext2D, src:string|undefined, vx:number, vy:number, vw:number, vh:number){
  // Si image absente → placeholder
  if (!src) { ctx.fillStyle = '#cbd5e1'; roundRect(ctx, vx, vy, vw, vh, 12, true, false); ctx.font = '100px sans-serif'; ctx.fillStyle = '#94a3b8'; ctx.fillText('🃏', vx + vw/2 - 50, vy + vh/2 + 30); return }
  // Si image cross-origin sans CORS, on évite de l’insérer pour ne pas “tainter” le canvas.
  const isSameOrigin = src.startsWith('/') || src.startsWith(window.location.origin) || src.startsWith('data:')
  if (!isSameOrigin) {
    ctx.fillStyle = '#fff'; roundRect(ctx, vx, vy, vw, vh, 12, true, false)
    ctx.strokeStyle = '#e2e8f0'; ctx.strokeRect(vx, vy, vw, vh)
    ctx.fillStyle = '#64748b'; ctx.font = '12px sans-serif'
    ctx.fillText('Image externe non exportable (CORS)', vx + 12, vy + 24)
    return
  }
  await new Promise<void>((resolve) => {
    const img = new Image()
    if (!src.startsWith('data:')) img.crossOrigin = 'anonymous'
    img.onload = () => {
      const iw = img.naturalWidth, ih = img.naturalHeight
      const s = Math.min(vw / iw, vh / ih) // contain
      const dw = iw * s, dh = ih * s
      const dx = vx + (vw - dw) / 2, dy = vy + (vh - dh) / 2
      ctx.drawImage(img, dx, dy, dw, dh)
      resolve()
    }
    img.onerror = () => resolve()
    img.src = src
  })
}
function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border/70 px-2 py-2">
      <div className="text-[11px] text-muted">{label}</div>
      <div className="font-mono font-semibold">{value}</div>
    </div>
  )
}
