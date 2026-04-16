import { Outlet } from 'react-router-dom'

import { MobileFrame } from './MobileFrame'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'
import { useAuthStore } from '../../stores/auth'

export function ConsoleShell() {
  const role = useAuthStore((s) => s.me?.role)
  const items =
    role === 'ADMIN'
      ? [
          { to: '/console/reports', label: '신고큐' },
          { to: '/console/monitoring', label: '모니터링' },
          { to: '/console/rewards', label: '보상' },
          { to: '/console/users', label: '유저' },
          { to: '/console/more', label: '더보기' },
        ]
      : [
          { to: '/console/reports', label: '신고큐' },
          { to: '/console/monitoring', label: '모니터링' },
          { to: '/app/dashboard', label: '헌터앱' },
        ]

  return (
    <MobileFrame>
      <div className="flex min-h-screen flex-col">
        <TopBar />
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <Outlet />
        </div>
        <BottomNav items={items} />
      </div>
    </MobileFrame>
  )
}
