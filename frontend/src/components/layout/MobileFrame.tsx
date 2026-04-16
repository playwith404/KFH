import type { ReactNode } from 'react'

export function MobileFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-slate-100 md:flex md:justify-center md:py-8">
      <div className="min-h-screen w-full bg-white md:min-h-[860px] md:max-w-[420px] md:rounded-3xl md:shadow-xl">
        {children}
      </div>
    </div>
  )
}

