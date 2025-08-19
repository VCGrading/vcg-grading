import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [qs] = useSearchParams()
  const next = qs.get('next') || '/account'

  useEffect(() => {
    // Supabase gère le hash (access_token…) automatiquement.
    // On attend juste que la session soit en place, puis on redirige.
    const run = async () => {
      try {
        await supabase.auth.getSession()
      } finally {
        navigate(next, { replace: true })
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section className="container py-12">
      <div className="card p-6">
        Connexion en cours…
      </div>
    </section>
  )
}
