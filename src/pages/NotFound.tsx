import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'

export default function NotFound() {
  const { t } = useI18n()
  return (
    <section className="container py-24 text-center">
      <div className="text-7xl">😵‍💫</div>
      <h1 className="mt-4 text-2xl font-bold">{t('notfound.title')}</h1>
      <p className="text-muted mt-2">{t('notfound.desc')}</p>
      <Link to="/" className="btn-primary mt-6">{t('notfound.back')}</Link>
    </section>
  )
}
