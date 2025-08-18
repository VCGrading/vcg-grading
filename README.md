# VCG Grading – Starter React (Vite + TS + Tailwind)

Starter front complet pour un site de grading de cartes "vibe SaaS".
Comprend : landing, commande, suivi, vérification de certificat, compte, badges avec réductions,
header/footer pros, dark mode, responsive.

## Lancer en local

```bash
npm i
npm run dev
```

## Pages

- `/` : Landing (héros, steps, pricing, badges)
- `/order/new` : Formulaire de commande (mock)
- `/orders/:orderId` : Détails avec timeline de suivi
- `/verify` / `/verify/:certId` : Vérification de certificat (mock data)
- `/account` : Compte + historique (mock data)

## À brancher côté backend (à venir)

- Auth & comptes (ex: Supabase/Auth.js)
- Paiement (Stripe)
- Persistances commandes/certificats (Postgres + Prisma)
- Génération du numéro de certificat + QR + page publique
- Système de paliers/badges (déjà implémenté en UI)

## Customisation du design

- Couleurs & typo : `tailwind.config.js`
- Thème sombre : `components/ThemeToggle.tsx` (persisté localStorage)
- Composants UI réutilisables dans `src/components`
