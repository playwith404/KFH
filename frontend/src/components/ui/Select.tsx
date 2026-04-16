import type { SelectHTMLAttributes } from 'react'

export function Select({
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      {label ? <div className="mb-1 text-xs font-medium text-slate-700">{label}</div> : null}
      <select
        {...props}
        className={[
          'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900',
          'focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200',
          props.className ?? '',
        ].join(' ')}
      >
        {children}
      </select>
    </label>
  )
}

