import { useQuery } from '@tanstack/react-query'

import { api } from '../../api/client'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'

export function RankingPage() {
  const rankingQuery = useQuery({
    queryKey: ['ranking', 'weekly'],
    queryFn: async () => {
      const res = await api.get<any[]>('/ranking', { params: { period: 'weekly' } })
      return res.data
    },
  })

  return (
    <div className="space-y-3">
      <Card>
        <div className="text-sm font-semibold text-slate-900">명예의 전당</div>
        <div className="mt-1 text-xs text-slate-500">주간 랭킹(데모)</div>
      </Card>

      <Card className="space-y-2">
        {(rankingQuery.data ?? []).map((r: any, idx: number) => (
          <div key={r.user_id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-3 py-2">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900">
                {idx + 1}위 · {r.email ?? r.user_id}
              </div>
              <div className="text-xs text-slate-500">user_id: {r.user_id}</div>
            </div>
            <Badge tone="indigo">{r.score}P</Badge>
          </div>
        ))}
        {(rankingQuery.data ?? []).length === 0 ? <div className="text-sm text-slate-500">랭킹 데이터가 없어요.</div> : null}
      </Card>
    </div>
  )
}

