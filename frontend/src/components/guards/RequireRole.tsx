import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuthStore, type UserRole } from '../../stores/auth'

export function RequireRole({ allowed, children }: { allowed: UserRole[]; children: ReactNode }) {
  const me = useAuthStore((s) => s.me)
  if (!me) return <Navigate to="/auth/login" replace />
  if (!allowed.includes(me.role)) return <Navigate to="/app/dashboard" replace />
  return <>{children}</>
}

