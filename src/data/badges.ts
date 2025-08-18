export type Tier = 'bois'|'pierre'|'bronze'|'argent'|'or'|'diamant'

export const TIERS: { tier: Tier; threshold: number; discount: number; }[] = [
  { tier: 'bois', threshold: 0, discount: 0 },
  { tier: 'pierre', threshold: 100, discount: 2 },
  { tier: 'bronze', threshold: 250, discount: 4 },
  { tier: 'argent', threshold: 500, discount: 6 },
  { tier: 'or', threshold: 1000, discount: 8 },
  { tier: 'diamant', threshold: 2000, discount: 12 },
]

export function tierForSpend(totalSpend: number) {
  let current = TIERS[0]
  for (const t of TIERS) {
    if (totalSpend >= t.threshold) current = t
  }
  return current
}
