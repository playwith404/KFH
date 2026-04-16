import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { api } from '../../api/client'
import type { Report } from '../../api/types'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'

function tone(status: string) {
  if (status === 'APPROVED') return 'green'
  if (status === 'REJECTED') return 'red'
  if (status === 'AWAITING_POLICE') return 'yellow'
  if (status === 'MONITORING') return 'gray'
  return 'indigo'
}

export function ReportsPage() {
  const reportsQuery = useQuery({
    queryKey: ['reports', 'mine'],
    queryFn: async () => {
      const res = await api.get<Report[]>('/reports', { params: { mine: true } })
      return res.data
    },
  })

  return (
    <div className="space-y-3">
      <Card>
        <div className="text-sm font-semibold text-slate-900">내 신고</div>
        <div className="mt-1 text-xs text-slate-500">2차 검증 제출 후 교차검증/경찰 승인 흐름으로 진행됩니다.</div>
      </Card>

      {reportsQuery.isLoading ? <div className="text-sm text-slate-600">불러오는 중…</div> : null}
      {reportsQuery.isError ? <div className="text-sm text-rose-600">신고를 불러오지 못했어요.</div> : null}

      <div className="space-y-2">
        {(reportsQuery.data ?? []).map((r) => (
          <Link key={r.id} to={`/app/reports/${r.id}`} className="block rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">{r.primary_evidence_key ?? '증거 대기'}</div>
              <Badge tone={tone(r.status) as any}>{r.status}</Badge>
            </div>
            <div className="mt-1 text-xs text-slate-500">{new Date(r.created_at).toLocaleString()}</div>
            <div className="mt-2 text-xs text-slate-500">
              AI 지표 {r.stage1_indicator_hits}/5 · {r.stage1_pass ? '1차 통과' : '1차 보류'}
            </div>
          </Link>
        ))}
        {(reportsQuery.data ?? []).length === 0 ? (
          <div className="text-sm text-slate-500">아직 신고가 없어요. 사냥 세션에서 “신고 초안”을 생성해 보세요.</div>
        ) : null}
      </div>
    </div>
  )
}

