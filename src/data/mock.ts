import type { Tier } from './badges'

export type Subgrades = { surface: number; edges: number; centering: number; corners: number }

export type Certificate = {
  id: string
  card: { game: string; name: string; set: string; number: string; year: number }
  grade: number
  date: string
  serial: string
  qrUrl: string
  imageUrl?: string
  subgrades?: Subgrades        // <- NOUVEAU
}

export type Order = {
  id: string
  status: 'créée'|'réceptionnée'|'en évaluation'|'évaluée'|'expédiée'
  items: number
  total: number
  createdAt: string
  tracking?: string
}

export const mockUser = {
  name: 'Vincent',
  email: 'vincent@example.com',
  totalSpend: 780,
  tier: 'argent' as Tier,
  orders: [
    { id: 'ORD-1003', status: 'expédiée', items: 3, total: 129, createdAt: '2025-08-04', tracking: 'CH123456789FR' },
    { id: 'ORD-1002', status: 'évaluée', items: 1, total: 49, createdAt: '2025-07-10' },
    { id: 'ORD-1001', status: 'réceptionnée', items: 5, total: 199, createdAt: '2025-06-01' },
  ] as Order[]
}

export const mockCertificates: Certificate[] = [
  {
    id: 'CERT-VCG-0001',
    serial: 'NG-0001',
    card: { game: 'Pokémon', name: 'Pikachu', set: 'Base Set', number: '58/102', year: 1999 },
    grade: 9.5,
    date: '2025-01-15T00:00:00.000Z',
    subgrades: { surface: 9.5, edges: 9, centering: 9, corners: 10 },
    qrUrl: '/verify/CERT-VCG-0001',
    imageUrl: '/cards/pikachu.png'
  },
]
