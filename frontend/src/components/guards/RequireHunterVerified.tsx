import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useOnboardingStatusQuery } from '../../api/hooks'
import { useAuthStore } from '../../stores/auth'

function Loader() {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">확인 중…</div>
}

export function RequireHunterVerified({ children }: { children: ReactNode }) {
  const me = useAuthStore((s) => s.me)
  const enabled = Boolean(me && me.role === 'HUNTER')
  const statusQuery = useOnboardingStatusQuery(enabled)

  if (!me) return <Navigate to="/auth/login" replace />
  if (me.role !== 'HUNTER') return <>{children}</>

  if (statusQuery.isLoading) return <Loader />
  if (statusQuery.isError) return <Navigate to="/onboarding/identity" replace />

  if (!statusQuery.data?.hunter_verified) return <Navigate to="/onboarding/identity" replace />
  return <>{children}</>
}

