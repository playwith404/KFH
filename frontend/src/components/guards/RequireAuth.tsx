import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useMeQuery } from '../../api/hooks'
import { useAuthStore } from '../../stores/auth'

function Loader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-sm text-slate-600">불러오는 중…</div>
    </div>
  )
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation()
  const accessToken = useAuthStore((s) => s.accessToken)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const clear = useAuthStore((s) => s.clear)

  const meQuery = useMeQuery(Boolean(accessToken || refreshToken))

  if (!accessToken && !refreshToken) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />
  }

  if (meQuery.isLoading) return <Loader />
  if (meQuery.isError) {
    clear()
    return <Navigate to="/auth/login" replace />
  }

  return <>{children}</>
}
