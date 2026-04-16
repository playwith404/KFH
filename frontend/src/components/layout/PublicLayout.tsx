import { Outlet } from 'react-router-dom'

import { MobileFrame } from './MobileFrame'

export function PublicLayout() {
  return (
    <MobileFrame>
      <Outlet />
    </MobileFrame>
  )
}

