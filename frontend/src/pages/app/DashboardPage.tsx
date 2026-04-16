import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { api } from '../../api/client'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'

type Summary = {
  me: { id: string; email: string; role: string }
  points_balance: number
  kpi: {
    deployments_today: number
    active_sessions_total: number
    my_reports_total: number
    my_reports_approved: number
  }
}

export function DashboardPage() {
  const summaryQuery = useQuery({
    queryKey: ['me', 'summary'],
    queryFn: async () => {
      const res = await api.get<Summary>('/me/summary')
      return res.data
    },
    staleTime: 3_000,
  })

  const s = summaryQuery.data

  return (
    <div className="space-y-3">
      <Card className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">오늘의 활동</div>
          <Badge tone="indigo">{s ? `${s.points_balance}P` : '—'}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-slate-50 p-3">
            <div className="text-xs text-slate-500">오늘 배포</div>
            <div className="text-lg font-extrabold text-slate-900">{s?.kpi.deployments_today ?? '—'}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <div className="text-xs text-slate-500">진행 세션</div>
            <div className="text-lg font-extrabold text-slate-900">{s?.kpi.active_sessions_total ?? '—'}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <div className="text-xs text-slate-500">내 신고</div>
            <div className="text-lg font-extrabold text-slate-900">{s?.kpi.my_reports_total ?? '—'}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <div className="text-xs text-slate-500">승인</div>
            <div className="text-lg font-extrabold text-slate-900">{s?.kpi.my_reports_approved ?? '—'}</div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Link to="/app/baits" className="block rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-semibold text-slate-900">미끼 살포</div>
          <div className="mt-1 text-xs text-slate-500">복사·배포 기록</div>
        </Link>
        <Link to="/app/hunt" className="block rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-semibold text-slate-900">사냥 관전</div>
          <div className="mt-1 text-xs text-slate-500">실시간 세션</div>
        </Link>
        <Link to="/app/reports" className="block rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-semibold text-slate-900">신고</div>
          <div className="mt-1 text-xs text-slate-500">2차 검증</div>
        </Link>
        <Link to="/app/rewards" className="block rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-semibold text-slate-900">보상</div>
          <div className="mt-1 text-xs text-slate-500">포인트 교환</div>
        </Link>
      </div>
    </div>
  )
}

