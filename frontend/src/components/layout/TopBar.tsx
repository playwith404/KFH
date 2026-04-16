import { Link, useLocation } from 'react-router-dom'

import { useAuthStore } from '../../stores/auth'

const titles: Array<[RegExp, string]> = [
  [/^\/app\/dashboard/, '대시보드'],
  [/^\/app\/baits/, '미끼'],
  [/^\/app\/hunt/, '사냥'],
  [/^\/app\/reports/, '신고'],
  [/^\/app\/rewards/, '보상'],
  [/^\/app\/ranking/, '랭킹'],
  [/^\/app\/global/, '오염 현황'],
  [/^\/app\/notifications/, '알림'],
  [/^\/app\/profile/, '내 정보'],
  [/^\/console\/reports/, '신고 큐'],
  [/^\/console\/monitoring/, '모니터링'],
  [/^\/console\/users/, '사용자'],
  [/^\/console\/rewards/, '보상 처리'],
  [/^\/console\/simulate/, '시뮬레이션'],
  [/^\/onboarding/, '온보딩'],
]

function getTitle(pathname: string) {
  for (const [re, title] of titles) {
    if (re.test(pathname)) return title
  }
  return 'K-Phishing Hunterz'
}

export function TopBar() {
  const location = useLocation()
  const me = useAuthStore((s) => s.me)

  return (
    <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-slate-900">{getTitle(location.pathname)}</div>
        {me ? (
          <div className="truncate text-xs text-slate-500">
            {me.email} · {me.role}
          </div>
        ) : null}
      </div>
      <Link
        to={location.pathname.startsWith('/console') ? '/console/reports' : '/app/notifications'}
        className="rounded-xl border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        알림
      </Link>
    </div>
  )
}

