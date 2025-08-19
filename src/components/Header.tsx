// src/components/Header.tsx
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import LanguageToggle from './LanguageToggle'
import { useI18n } from '../i18n'
import { useAuth } from '../auth/AuthProvider'

function cls(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(' ')
}

export default function Header() {
  const { t } = useI18n()
  const { user, signOut } = useAuth() as { user: any; signOut?: () => Promise<void> }
  const [open, setOpen] = useState(false)

  // Nav: Commander → Vérifier → Compte
  const navItems = [
    { to: '/order/new', label: t('nav.order') || 'Commander' },
    { to: '/verify', label: t('nav.verify') || 'Vérifier' },
    { to: '/account', label: t('nav.account') || 'Compte' },
  ]

  const handleLogout = async () => {
    try {
      if (signOut) await signOut()
    } finally {
      // On force un refresh propre de l’app
      window.location.href = '/'
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-surface/90 backdrop-blur">
      <div className="container h-14 flex items-center justify-between gap-3">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-indigo-500" />
          <span>{t('brand.name') || 'VCG Grading'}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cls(
                  'text-sm hover:text-foreground/90',
                  isActive ? 'text-foreground font-medium' : 'text-muted'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right side (lang + login/logout) */}
        <div className="hidden md:flex items-center gap-3">
          <LanguageToggle />
          {!user ? (
            <Link to="/login" className="btn-primary">
              {t('nav.login') || 'Connexion'}
            </Link>
          ) : (
            <button className="btn-outline" onClick={handleLogout}>
              {t('nav.logout') || 'Déconnexion'}
            </button>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden h-9 w-9 grid place-items-center rounded-lg border border-border hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Open menu"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="i-lucide-menu h-5 w-5" />
        </button>
      </div>

      {/* Mobile sheet */}
      {open && (
        <div className="md:hidden border-t border-border/70 bg-surface">
          <div className="container py-4 space-y-4">
            <div className="flex items-center justify-between">
              <LanguageToggle />
              {!user ? (
                <Link to="/login" className="btn-primary" onClick={() => setOpen(false)}>
                  {t('nav.login') || 'Connexion'}
                </Link>
              ) : (
                <button
                  className="btn-outline"
                  onClick={async () => {
                    await handleLogout()
                    setOpen(false)
                  }}
                >
                  {t('nav.logout') || 'Déconnexion'}
                </button>
              )}
            </div>

            <nav className="grid gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cls(
                      'rounded-lg px-3 py-2 text-sm',
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-foreground'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-muted'
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
