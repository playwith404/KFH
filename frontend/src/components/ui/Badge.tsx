import type { ReactNode } from 'react'

type Tone = 'gray' | 'green' | 'yellow' | 'red' | 'indigo'

const tones: Record<Tone, string> = {
  gray: 'bg-slate-100 text-slate-700',
  green: 'bg-emerald-100 text-emerald-700',
  yellow: 'bg-amber-100 text-amber-800',
  red: 'bg-rose-100 text-rose-700',
  indigo: 'bg-indigo-100 text-indigo-700',
}

export function Badge({ children, tone = 'gray' }: { children: ReactNode; tone?: Tone }) {
  return <span className={['inline-flex rounded-full px-2 py-0.5 text-xs font-semibold', tones[tone]].join(' ')}>{children}</span>
}

