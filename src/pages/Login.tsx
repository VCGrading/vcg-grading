import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'

export default function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [qs] = useSearchParams()
  const next = qs.get('next') || '/account'
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && user) navigate(next, { replace: true })
  }, [authLoading, user, navigate, next])

  async function sendMagic() {
    setErr(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
        }
      })
      if (error) throw error
      setSent(true)
    } catch (e: any) {
      setErr(e?.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  async function loginWithGoogle() {
    setErr(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          queryParams: { access_type: 'offline', prompt: 'consent' }
        }
      })
      if (error) throw error
      // Redirection faite par Google -> Supabase -> /auth/callback
    } catch (e: any) {
      setErr(e?.message || 'Connexion Google impossible')
    }
  }

  return (
    <section className="container py-12 max-w-lg">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">Connexion</h1>
        <p className="text-sm text-muted">Choisissez votre méthode préférée.</p>

        <div className="mt-6">
          <label className="text-sm text-muted">Email</label>
          <input
            type="email"
            className="mt-1 w-full rounded-lg border border-border bg-white dark:bg-slate-900 px-4 py-2"
            placeholder="vous@exemple.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <button
            className="btn-primary mt-3 w-full"
            onClick={sendMagic}
            disabled={!email || sent || loading}
          >
            {sent ? 'Lien envoyé ✉️' : (loading ? 'Envoi…' : 'Recevoir un lien magique')}
          </button>
          {sent && (
            <p className="mt-2 text-xs text-muted">
              Vérifiez votre boîte mail et cliquez sur « Se connecter ».
            </p>
          )}
        </div>

        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted">ou</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button className="btn-outline w-full" onClick={loginWithGoogle}>
          Continuer avec Google
        </button>

        {err && <div className="mt-4 text-sm text-red-600 dark:text-red-400">{err}</div>}
      </div>
    </section>
  )
}
