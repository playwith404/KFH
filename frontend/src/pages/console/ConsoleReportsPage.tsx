import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { api } from '../../api/client'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Select } from '../../components/ui/Select'

const statuses = [
  { value: '', label: '전체' },
  { value: 'AWAITING_POLICE', label: '경찰 검토 대기' },
  { value: 'MONITORING', label: '모니터링' },
  { value: 'APPROVED', label: '승인' },
  { value: 'REJECTED', label: '반려' },
]

export function ConsoleReportsPage() {
  const [status, setStatus] = useState('AWAITING_POLICE')

  const reportsQuery = useQuery({
    queryKey: ['console', 'reports', status],
    queryFn: async () => {
      const res = await api.get<any[]>('/console/reports', { params: status ? { status } : {} })
      return res.data
    },
  })

  return (
    <div className="space-y-3">
      <Card className="space-y-2">
        <div className="text-sm font-semibold text-slate-900">신고 승인 큐</div>
        <div className="text-xs text-slate-500">교차검증 충족 시 경찰 검토 대상으로 이동합니다.</div>
        <Select label="상태 필터" value={status} onChange={(e) => setStatus(e.target.value)}>
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </Card>

      <Card className="space-y-2">
        {(reportsQuery.data ?? []).map((r: any) => (
          <Link key={r.id} to={`/console/reports/${r.id}`} className="block rounded-2xl border border-slate-200 px-3 py-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">{r.primary_evidence_key ?? '증거 대기'}</div>
              <Badge tone="indigo">{r.status}</Badge>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              AI {r.stage1_indicator_hits}/5 · 신고자 {r.created_by_user_id}
            </div>
            <div className="mt-1 text-xs text-slate-500">{new Date(r.created_at).toLocaleString()}</div>
          </Link>
        ))}
        {(reportsQuery.data ?? []).length === 0 ? <div className="text-sm text-slate-500">표시할 신고가 없어요.</div> : null}
      </Card>
    </div>
  )
}
