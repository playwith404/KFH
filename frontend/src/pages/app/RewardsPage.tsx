import { useMutation, useQuery } from '@tanstack/react-query'

import { api } from '../../api/client'
import type { PointsLedgerResponse, RewardItem } from '../../api/types'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'

export function RewardsPage() {
  const ledgerQuery = useQuery({
    queryKey: ['points', 'ledger'],
    queryFn: async () => {
      const res = await api.get<PointsLedgerResponse>('/points/ledger')
      return res.data
    },
  })

  const catalogQuery = useQuery({
    queryKey: ['rewards', 'catalog'],
    queryFn: async () => {
      const res = await api.get<RewardItem[]>('/rewards/catalog')
      return res.data
    },
  })

  const myRedemptionsQuery = useQuery({
    queryKey: ['rewards', 'redemptions', 'mine'],
    queryFn: async () => {
      const res = await api.get<any[]>('/rewards/redemptions')
      return res.data
    },
  })

  const redeemMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      const res = await api.post('/rewards/redemptions', { reward_id: rewardId })
      return res.data
    },
    onSuccess: async () => {
      await ledgerQuery.refetch()
      await myRedemptionsQuery.refetch()
    },
  })

  const balance = ledgerQuery.data?.balance ?? 0

  return (
    <div className="space-y-3">
      <Card className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">포인트</div>
          <div className="mt-1 text-xs text-slate-500">포인트 원장 기반(데모)</div>
        </div>
        <Badge tone="indigo">{balance}P</Badge>
      </Card>

      <Card className="space-y-2">
        <div className="text-sm font-semibold text-slate-900">보상 카탈로그</div>
        {(catalogQuery.data ?? []).map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-3 py-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-900">{r.title}</div>
              <div className="text-xs text-slate-500">{r.cost_points}P</div>
            </div>
            <Button
              variant="secondary"
              disabled={balance < r.cost_points || redeemMutation.isPending}
              onClick={() => redeemMutation.mutate(r.id)}
            >
              교환
            </Button>
          </div>
        ))}
        {(catalogQuery.data ?? []).length === 0 ? <div className="text-sm text-slate-500">보상이 없어요.</div> : null}
      </Card>

      <Card className="space-y-2">
        <div className="text-sm font-semibold text-slate-900">교환 신청 내역</div>
        {(myRedemptionsQuery.data ?? []).map((x) => (
          <div key={x.id} className="rounded-2xl border border-slate-200 px-3 py-2">
            <div className="flex items-center justify-between">
              <Badge>{x.status}</Badge>
              <div className="text-xs text-slate-500">{new Date(x.requested_at).toLocaleString()}</div>
            </div>
            {x.note ? <div className="mt-1 text-sm text-slate-700">{x.note}</div> : null}
          </div>
        ))}
        {(myRedemptionsQuery.data ?? []).length === 0 ? (
          <div className="text-sm text-slate-500">아직 교환 신청이 없어요.</div>
        ) : null}
      </Card>

      <Card className="space-y-2">
        <div className="text-sm font-semibold text-slate-900">최근 포인트 내역</div>
        <div className="space-y-2">
          {(ledgerQuery.data?.entries ?? []).slice(0, 10).map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-3 py-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900">{e.reason_code}</div>
                <div className="text-xs text-slate-500">{new Date(e.created_at).toLocaleString()}</div>
              </div>
              <Badge tone={e.delta >= 0 ? 'green' : 'red'}>{e.delta >= 0 ? `+${e.delta}` : `${e.delta}`}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

