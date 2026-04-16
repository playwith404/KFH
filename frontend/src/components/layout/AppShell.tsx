import { Outlet } from 'react-router-dom'

import { MobileFrame } from './MobileFrame'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'

export function AppShell() {
  return (
    <MobileFrame>
      <div className="flex min-h-screen flex-col">
        <TopBar />
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <Outlet />
        </div>
        <BottomNav
          items={[
            { to: '/app/dashboard', label: '홈' },
            { to: '/app/baits', label: '미끼' },
            { to: '/app/hunt', label: '사냥' },
            { to: '/app/reports', label: '신고' },
            { to: '/app/profile', label: '내정보' },
          ]}
        />
      </div>
    </MobileFrame>
  )
}

