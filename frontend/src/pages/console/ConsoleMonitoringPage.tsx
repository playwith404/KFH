import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { api } from '../../api/client'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'

export function ConsoleMonitoringPage() {
  const monitoringQuery = useQuery({
    queryKey: ['console', 'monitoring'],
    queryFn: async () => {
      const res = await api.get<any[]>('/console/monitoring')
      return res.data
    },
  })

  return (
    <div className="space-y-3">
      <Card>
        <div className="text-sm font-semibold text-slate-900">모니터링 대상</div>
        <div className="mt-1 text-xs text-slate-500">단일 신고는 30일간 추가 신고를 대기합니다(데모).</div>
      </Card>

      <Card className="space-y-2">
        {(monitoringQuery.data ?? []).map((r: any) => (
          <Link key={r.id} to={`/console/reports/${r.id}`} className="block rounded-2xl border border-slate-200 px-3 py-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">{r.primary_evidence_key ?? '—'}</div>
              <Badge tone="gray">{r.status}</Badge>
            </div>
            <div className="mt-1 text-xs text-slate-500">{r.monitoring_until ?? ''}</div>
          </Link>
        ))}
        {(monitoringQuery.data ?? []).length === 0 ? <div className="text-sm text-slate-500">없어요.</div> : null}
      </Card>
    </div>
  )
}

