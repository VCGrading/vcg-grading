import { Link, NavLink } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
import LanguageToggle from './LanguageToggle'
import { useI18n } from '../i18n'

function NavItem({ to, children }: {to: string, children: React.ReactNode}) {
  return (
    <NavLink
      to={to}
      className={({isActive}) =>
        'px-3 py-2 rounded-md text-sm font-medium ' +
        (isActive ? 'text-brand dark:text-brand-light' : 'text-muted hover:text-foreground')
      }>
      {children}
    </NavLink>
  )
}

export default function Header() {
  const { t } = useI18n()

  return (
    <header className="sticky top-0 z-40 bg-surface/80 dark:bg-slate-950/70 backdrop-blur border-b border-border/70">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <div className="h-8 w-8 rounded-lg bg-brand"></div>
          <span>{t('brand.name')}</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          <NavItem to="/">{t('nav.home')}</NavItem>
          <NavItem to="/order/new">{t('nav.order')}</NavItem>
          <NavItem to="/verify">{t('nav.verify')}</NavItem>
          <NavItem to="/account">{t('nav.account')}</NavItem>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/order/new" className="btn-primary hidden sm:inline-flex">{t('nav.cta')}</Link>
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
