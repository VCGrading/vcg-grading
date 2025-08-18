import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'

export default function Footer() {
  const { t } = useI18n()
  return (
    <footer className="border-t border-border/70 bg-surface dark:bg-slate-950">
      <div className="container py-10 grid sm:grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div>
          <div className="flex items-center gap-2 font-semibold mb-3">
            <div className="h-6 w-6 rounded-lg bg-brand"></div>
            <span>{t('brand.name')}</span>
          </div>
          <p className="text-muted">{t('footer.tagline')}</p>
        </div>
        <div>
          <h4 className="font-semibold mb-3">{t('footer.product')}</h4>
          <ul className="space-y-2 text-muted">
            <li><Link to="/" className="hover:text-foreground">{t('nav.home')}</Link></li>
            <li><Link to="/order/new" className="hover:text-foreground">{t('nav.order')}</Link></li>
            <li><Link to="/verify" className="hover:text-foreground">{t('nav.verify')}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">{t('footer.company')}</h4>
          <ul className="space-y-2 text-muted">
            <li><a className="hover:text-foreground" href="#">{t('footer.tos')}</a></li>
            <li><a className="hover:text-foreground" href="#">{t('footer.privacy')}</a></li>
            <li><a className="hover:text-foreground" href="#">{t('footer.contact')}</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">{t('footer.social')}</h4>
          <ul className="space-y-2 text-muted">
            <li><a className="hover:text-foreground" href="#">{t('footer.instagram')}</a></li>
            <li><a className="hover:text-foreground" href="#">{t('footer.twitter')}</a></li>
            <li><a className="hover:text-foreground" href="#">{t('footer.youtube')}</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/70 py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} {t('brand.name')}. {t('footer.copyright')}
      </div>
    </footer>
  )
}
