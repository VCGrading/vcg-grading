import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export default function Login() {
  const { signInWithEmail, signInWithGoogle, user } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [search] = useSearchParams()
  const navigate = useNavigate()

  if (user) {
    const next = search.get('next') || '/'
    navigate(next, { replace: true })
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    try {
      await signInWithEmail(email)
      setSent(true)
    } catch (e: any) {
      setErr(e?.message || 'Erreur')
    }
  }

  return (
    <section className="container py-12">
      <div className="mx-auto max-w-md card p-6">
        <h1 className="text-2xl font-bold">Connexion</h1>
        <p className="text-muted mt-1">Recevez un lien magique par email ou utilisez Google.</p>

        <form className="mt-6 space-y-3" onSubmit={submit}>
          <div>
            <label className="text-sm text-muted">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              className="mt-1 w-full rounded-lg border border-border bg-white dark:bg-slate-900 px-4 py-2"
            />
          </div>
          {err && <div className="text-sm text-red-600 dark:text-red-400">{err}</div>}
          {sent ? (
            <div className="text-sm">Lien envoyé. Vérifiez votre boîte mail.</div>
          ) : (
            <button type="submit" className="btn-primary w-full">Recevoir un lien</button>
          )}
        </form>

        <div className="mt-4">
          <button onClick={signInWithGoogle} className="btn-outline w-full">Continuer avec Google</button>
        </div>
      </div>
    </section>
  )
}
