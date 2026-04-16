import type { TextareaHTMLAttributes } from 'react'

export function Textarea({
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block">
      {label ? <div className="mb-1 text-xs font-medium text-slate-700">{label}</div> : null}
      <textarea
        {...props}
        className={[
          'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400',
          'focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200',
          props.className ?? '',
        ].join(' ')}
      />
    </label>
  )
}

