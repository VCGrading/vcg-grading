import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export default function Header() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const loc = useLocation()
  const goLogin = () => navigate(`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`)

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-surface/80 backdrop-blur">
      <div className="container h-14 flex items-center justify-between">
        <Link to="/" className="font-semibold">VCG Grading</Link>
        <nav className="flex items-center gap-3">
          <Link to="/order/new" className="btn-outline">Commander</Link>
          <Link to="/verify" className="btn-outline">Vérifier</Link>
          {user ? (
            <>
              <Link to="/account" className="btn-primary">Mon compte</Link>
              <button className="text-sm text-muted hover:text-foreground" onClick={() => signOut()}>Se déconnecter</button>
            </>
          ) : (
            <button className="btn-primary" onClick={goLogin}>Se connecter</button>
          )}
        </nav>
      </div>
    </header>
  )
}
