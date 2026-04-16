import { useQuery } from '@tanstack/react-query'

import { api } from '../../api/client'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'

type Audit = {
  id: string
  actor_user_id: string
  action: string
  resource_type: string
  resource_id: string
  created_at: string
  details: any
}

export function ConsoleAuditPage() {
  const auditQuery = useQuery({
    queryKey: ['console', 'audit'],
    queryFn: async () => {
      const res = await api.get<Audit[]>('/console/audit')
      return res.data
    },
  })

  return (
    <div className="space-y-3">
      <Card>
        <div className="text-sm font-semibold text-slate-900">감사 로그</div>
        <div className="mt-1 text-xs text-slate-500">최근 200건</div>
      </Card>

      <Card className="space-y-2">
        {(auditQuery.data ?? []).map((l) => (
          <div key={l.id} className="rounded-2xl border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <Badge tone="gray">{l.action}</Badge>
              <div className="text-xs text-slate-500">{new Date(l.created_at).toLocaleString()}</div>
            </div>
            <div className="mt-1 text-xs text-slate-500">actor: {l.actor_user_id}</div>
            <div className="mt-1 text-xs text-slate-500">
              resource: {l.resource_type} / {l.resource_id}
            </div>
          </div>
        ))}
        {(auditQuery.data ?? []).length === 0 ? <div className="text-sm text-slate-500">로그가 없어요.</div> : null}
      </Card>
    </div>
  )
}

