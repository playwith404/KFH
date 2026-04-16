import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { api } from '../../api/client'
import type { TrainingModule } from '../../api/types'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'

function formatMinutes(seconds: number) {
  return Math.round(seconds / 60)
}

export function OnboardingTrainingPage() {
  const navigate = useNavigate()

  const modulesQuery = useQuery({
    queryKey: ['training', 'modules'],
    queryFn: async () => {
      const res = await api.get<TrainingModule[]>('/training/modules')
      return res.data
    },
  })

  const progressMutation = useMutation({
    mutationFn: async ({ moduleId, watched }: { moduleId: string; watched: number }) => {
      await api.post('/training/progress', { module_id: moduleId, watched_seconds: watched })
    },
    onSuccess: async () => {
      await modulesQuery.refetch()
    },
  })

  const completeMutation = useMutation({
    mutationFn: async () => {
      await api.post('/training/complete', {})
    },
    onSuccess: () => navigate('/onboarding/test'),
  })

  const modules = modulesQuery.data ?? []
  const allDone = modules.length > 0 && modules.every((m) => Boolean(m.completed_at))

  return (
    <Card className="space-y-3">
      <div className="text-sm font-semibold text-slate-900">온라인 교육 (총 2시간)</div>
      <div className="text-xs text-slate-600">데모에서는 각 모듈을 “완료 처리”하여 수료할 수 있어요.</div>

      {modulesQuery.isLoading ? <div className="text-sm text-slate-600">불러오는 중…</div> : null}
      {modulesQuery.isError ? <div className="text-sm text-rose-600">교육 모듈을 불러오지 못했어요.</div> : null}

      <div className="space-y-2">
        {modules.map((m) => {
          const done = Boolean(m.completed_at)
          const pct = Math.min(100, Math.round((m.watched_seconds / m.duration_seconds) * 100))
          return (
            <div key={m.id} className="rounded-2xl border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-900">{m.title}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {formatMinutes(m.duration_seconds)}분 · 진행률 {pct}%
                  </div>
                </div>
                {done ? <Badge tone="green">완료</Badge> : <Badge tone="yellow">진행</Badge>}
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-3">
                <Button
                  variant="secondary"
                  className="w-full"
                  disabled={done || progressMutation.isPending}
                  onClick={() => progressMutation.mutate({ moduleId: m.id, watched: m.duration_seconds })}
                >
                  {done ? '완료됨' : '완료 처리'}
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <Button className="w-full" disabled={!allDone || completeMutation.isPending} onClick={() => completeMutation.mutate()}>
        {allDone ? '수료하고 다음(테스트)로' : '모든 모듈을 완료해 주세요'}
      </Button>
    </Card>
  )
}

