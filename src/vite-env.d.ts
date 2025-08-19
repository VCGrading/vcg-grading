/// <reference types="vite/client" />

// (optionnel mais pratique) : déclare tes clés pour l’autocomplétion
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  // ajoute d'autres clés VITE_* si besoin
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
