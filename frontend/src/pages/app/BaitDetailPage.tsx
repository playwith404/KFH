import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'

import { api } from '../../api/client'
import type { Bait, BaitDeployment } from '../../api/types'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'

type Stats = { deployment_count: number; inbound_sessions: number }

export function BaitDetailPage() {
  const { baitId } = useParams()

  const baitQuery = useQuery({
    queryKey: ['baits', baitId],
    queryFn: async () => {
      const res = await api.get<Bait>(`/baits/${baitId}`)
      return res.data
    },
    enabled: Boolean(baitId),
  })

  const depsQuery = useQuery({
    queryKey: ['baits', baitId, 'deployments'],
    queryFn: async () => {
      const res = await api.get<BaitDeployment[]>(`/baits/${baitId}/deployments`)
      return res.data
    },
    enabled: Boolean(baitId),
  })

  const statsQuery = useQuery({
    queryKey: ['baits', baitId, 'stats'],
    queryFn: async () => {
      const res = await api.get<Stats>(`/baits/${baitId}/stats`)
      return res.data
    },
    enabled: Boolean(baitId),
  })

  const b = baitQuery.data

  return (
    <div className="space-y-3">
      <Link to="/app/baits" className="text-sm font-semibold text-indigo-600">
        ← 미끼 목록
      </Link>

      {b ? (
        <Card className="space-y-2">
          <div className="text-sm font-semibold text-slate-900">미끼</div>
          <div className="whitespace-pre-wrap text-sm text-slate-700">{b.rendered_body}</div>
          <div className="flex flex-wrap items-center gap-2">
            {b.virtual_phone ? <Badge>{b.virtual_phone}</Badge> : null}
            {b.virtual_messenger_id ? <Badge>{b.virtual_messenger_id}</Badge> : null}
          </div>
        </Card>
      ) : (
        <Card>불러오는 중…</Card>
      )}

      <Card className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">성과</div>
        <div className="flex items-center gap-2">
          <Badge tone="indigo">배포 {statsQuery.data?.deployment_count ?? '—'}</Badge>
          <Badge tone="green">유입 {statsQuery.data?.inbound_sessions ?? '—'}</Badge>
        </div>
      </Card>

      <Card className="space-y-2">
        <div className="text-sm font-semibold text-slate-900">배포 이력</div>
        {depsQuery.isLoading ? <div className="text-sm text-slate-600">불러오는 중…</div> : null}
        {depsQuery.isError ? <div className="text-sm text-rose-600">배포 이력을 불러오지 못했어요.</div> : null}
        <div className="space-y-2">
          {(depsQuery.data ?? []).map((d) => (
            <div key={d.id} className="rounded-2xl border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <Badge>{d.platform}</Badge>
                <div className="text-xs text-slate-500">{new Date(d.deployed_at).toLocaleString()}</div>
              </div>
              {d.post_url ? (
                <div className="mt-1 truncate text-sm text-indigo-600">
                  <a href={d.post_url} target="_blank" rel="noreferrer">
                    {d.post_url}
                  </a>
                </div>
              ) : null}
              {d.memo ? <div className="mt-1 text-sm text-slate-700">{d.memo}</div> : null}
            </div>
          ))}
          {(depsQuery.data ?? []).length === 0 ? (
            <div className="text-sm text-slate-500">아직 배포 이력이 없어요.</div>
          ) : null}
        </div>
      </Card>
    </div>
  )
}

