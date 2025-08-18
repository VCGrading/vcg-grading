import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export default function QR({ text, size = 96, className = '' }: { text: string; size?: number; className?: string }) {
  const [dataUrl, setDataUrl] = useState<string>('')

  useEffect(() => {
    let mounted = true
    QRCode.toDataURL(text, { errorCorrectionLevel: 'M', margin: 1, width: size })
      .then(url => { if (mounted) setDataUrl(url) })
      .catch(() => setDataUrl(''))
    return () => { mounted = false }
  }, [text, size])

  if (!dataUrl) return null
  return <img src={dataUrl} width={size} height={size} alt="QR" className={className} />
}
