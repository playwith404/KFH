import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { api } from '../../api/client'
import type { HuntSession } from '../../api/types'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

export function HuntSessionsPage() {
  const [status, setStatus] = useState<'ACTIVE' | 'ENDED'>('ACTIVE')

  const sessionsQuery = useQuery({
    queryKey: ['hunt', 'sessions', status],
    queryFn: async () => {
      const res = await api.get<HuntSession[]>('/hunt/sessions', { params: { status } })
      return res.data
    },
  })

  return (
    <div className="space-y-3">
      <Card className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">사냥 세션</div>
          <div className="mt-1 text-xs text-slate-500">유입 감지 시 세션이 생성됩니다(데모는 관리자 시뮬레이터).</div>
        </div>
        <Badge tone={status === 'ACTIVE' ? 'green' : 'gray'}>{status}</Badge>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Button variant={status === 'ACTIVE' ? 'secondary' : 'ghost'} onClick={() => setStatus('ACTIVE')}>
          진행중
        </Button>
        <Button variant={status === 'ENDED' ? 'secondary' : 'ghost'} onClick={() => setStatus('ENDED')}>
          종료됨
        </Button>
      </div>

      {sessionsQuery.isLoading ? <div className="text-sm text-slate-600">불러오는 중…</div> : null}
      {sessionsQuery.isError ? <div className="text-sm text-rose-600">세션을 불러오지 못했어요.</div> : null}

      <div className="space-y-2">
        {(sessionsQuery.data ?? []).map((s) => (
          <Link key={s.id} to={`/app/hunt/${s.id}`} className="block rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">{s.persona_type ?? '페르소나'}</div>
              <Badge tone={s.suspicion_score >= 60 ? 'red' : s.suspicion_score >= 40 ? 'yellow' : 'gray'}>
                의심 {s.suspicion_score}%
              </Badge>
            </div>
            <div className="mt-1 text-xs text-slate-500">{new Date(s.started_at).toLocaleString()}</div>
          </Link>
        ))}
        {(sessionsQuery.data ?? []).length === 0 ? (
          <div className="text-sm text-slate-500">표시할 세션이 없어요.</div>
        ) : null}
      </div>
    </div>
  )
}

