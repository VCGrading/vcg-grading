import React from 'react'

type Props = { status: string; className?: string }

const MAP: Record<string, string> = {
  'créée': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  'payée': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200',
  'réceptionnée': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  'en évaluation': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  'évaluée': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  'expédiée': 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200',
}

export default function StatusBadge({ status, className='' }: Props) {
  const base = MAP[status] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${base} ${className}`}>
      {status}
    </span>
  )
}
