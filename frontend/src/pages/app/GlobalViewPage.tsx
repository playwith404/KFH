import { useQuery } from '@tanstack/react-query'

import { api } from '../../api/client'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'

type Global = {
  pollution_percent: number
  crime_profit_change_percent: number
  today_activity_count: number
  total_sessions: number
  total_deployments: number
}

export function GlobalViewPage() {
  const globalQuery = useQuery({
    queryKey: ['analytics', 'global'],
    queryFn: async () => {
      const res = await api.get<Global>('/analytics/global')
      return res.data
    },
  })

  const dotsQuery = useQuery({
    queryKey: ['analytics', 'map-dots'],
    queryFn: async () => {
      const res = await api.get<{ dots: any[] }>('/analytics/map-dots')
      return res.data
    },
  })

  const g = globalQuery.data
  const dots = dotsQuery.data?.dots ?? []

  return (
    <div className="space-y-3">
      <Card>
        <div className="text-sm font-semibold text-slate-900">데이터 오염 현황</div>
        <div className="mt-1 text-xs text-slate-500">지도/지표는 데모 데이터로 표시될 수 있어요.</div>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Card className="space-y-1">
          <div className="text-xs text-slate-500">오염도</div>
          <div className="text-xl font-extrabold text-slate-900">{g ? `${g.pollution_percent}%` : '—'}</div>
        </Card>
        <Card className="space-y-1">
          <div className="text-xs text-slate-500">범죄 수익성 변화</div>
          <div className="text-xl font-extrabold text-slate-900">{g ? `${g.crime_profit_change_percent}%` : '—'}</div>
        </Card>
        <Card className="space-y-1">
          <div className="text-xs text-slate-500">금일 활동량</div>
          <div className="text-xl font-extrabold text-slate-900">{g ? `${g.today_activity_count}` : '—'}</div>
        </Card>
        <Card className="space-y-1">
          <div className="text-xs text-slate-500">도트 수</div>
          <div className="text-xl font-extrabold text-slate-900">{dots.length}</div>
        </Card>
      </div>

      <Card className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">지도(데모)</div>
          <Badge tone="gray">준비중</Badge>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          MVP에서는 지도 엔진을 연결하지 않고, 지표 중심으로 데모합니다.
        </div>
      </Card>
    </div>
  )
}

