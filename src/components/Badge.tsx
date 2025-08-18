type Props = { tier: 'bois'|'pierre'|'bronze'|'argent'|'or'|'diamant'; mini?: boolean }
const COLORS: Record<Props['tier'], string> = {
  bois: 'bg-[linear-gradient(135deg,#8b5a2b,#deb887)]',
  pierre: 'bg-[linear-gradient(135deg,#6b7280,#cbd5e1)]',
  bronze: 'bg-[linear-gradient(135deg,#b45309,#f59e0b)]',
  argent: 'bg-[linear-gradient(135deg,#64748b,#cbd5e1)]',
  or: 'bg-[linear-gradient(135deg,#ca8a04,#facc15)]',
  diamant: 'bg-[linear-gradient(135deg,#22d3ee,#a78bfa)]',
}
export default function Badge({ tier, mini=false }: Props) {
  return (
    <span className={"badge " + (mini ? 'text-xs' : 'text-sm')}>
      <span className={"h-3 w-3 rounded-full " + COLORS[tier]} />
      <span className="capitalize">{tier}</span>
    </span>
  )
}
