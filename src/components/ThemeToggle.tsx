import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  return (
    <button
      aria-label="Basculer le thème"
      onClick={() => setIsDark(v => !v)}
      className="btn-outline w-10 h-10 rounded-full grid place-items-center"
      title={isDark ? 'Passer en mode jour' : 'Passer en mode nuit'}
    >
      <span className="i">{isDark ? '🌙' : '☀️'}</span>
    </button>
  )
}
