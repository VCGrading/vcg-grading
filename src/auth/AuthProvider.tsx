import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { supabase } from '../lib/supabase'

type AuthCtx = {
  user: any | null
  session: any | null
  loading: boolean
  signInWithEmail: (email: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthCtx | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [session, setSession] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session || null)
      setUser(data.session?.user || null)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess)
      setUser(sess?.user || null)
    })
    return () => { sub.subscription.unsubscribe() }
  }, [])

  const signInWithEmail = async (email: string) => {
    await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
  }
  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }
  const signOut = async () => { await supabase.auth.signOut() }

  const value = useMemo(() => ({ user, session, loading, signInWithEmail, signInWithGoogle, signOut }), [user, session, loading])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
