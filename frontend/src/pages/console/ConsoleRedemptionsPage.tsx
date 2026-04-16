import { useMutation, useQuery } from '@tanstack/react-query'

import { api } from '../../api/client'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { useEffect, useState } from 'react'

type Reward = { id: string; title: string; cost_points: number; is_active: boolean; inventory: number | null }

export function ConsoleRedemptionsPage() {
  const [note, setNote] = useState('')
  const [newTitle, setNewTitle] = useState('데모 보상(100P)')
  const [newCost, setNewCost] = useState(100)
  const [newInventory, setNewInventory] = useState<number | ''>('')
  const [newActive, setNewActive] = useState(true)
  const [catalog, setCatalog] = useState<Reward[]>([])

  const catalogQuery = useQuery({
    queryKey: ['console', 'rewards', 'catalog'],
    queryFn: async () => {
      const res = await api.get<Reward[]>('/console/rewards/catalog')
      return res.data
    },
  })

  const redemptionsQuery = useQuery({
    queryKey: ['console', 'rewards', 'redemptions'],
    queryFn: async () => {
      const res = await api.get<any[]>('/console/rewards/redemptions')
      return res.data
    },
  })

  const createReward = useMutation({
    mutationFn: async () => {
      await api.post('/console/rewards/catalog', {
        title: newTitle,
        cost_points: Number(newCost),
        is_active: newActive,
        inventory: newInventory === '' ? null : Number(newInventory),
      })
    },
    onSuccess: async () => {
      await catalogQuery.refetch()
    },
  })

  const patchReward = useMutation({
    mutationFn: async (payload: Partial<Reward> & { id: string }) => {
      const { id, ...rest } = payload
      await api.patch(`/console/rewards/catalog/${id}`, rest)
    },
    onSuccess: async () => {
      await catalogQuery.refetch()
    },
  })

  useEffect(() => {
    if (catalogQuery.data) setCatalog(catalogQuery.data)
  }, [catalogQuery.data])

  const decideMutation = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      await api.post(`/console/rewards/redemptions/${id}/decision`, { approve, note: note || null })
    },
    onSuccess: async () => {
      setNote('')
      await redemptionsQuery.refetch()
    },
  })

  return (
    <div className="space-y-3">
      <Card className="space-y-2">
        <div className="text-sm font-semibold text-slate-900">보상 카탈로그</div>
        <div className="grid grid-cols-2 gap-2">
          <Input label="제목" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          <Input label="가격(P)" type="number" value={newCost} onChange={(e) => setNewCost(Number(e.target.value))} />
          <Input
            label="재고(선택)"
            type="number"
            value={newInventory}
            onChange={(e) => setNewInventory(e.target.value === '' ? '' : Number(e.target.value))}
          />
          <label className="flex items-end gap-2 pb-2 text-sm text-slate-700">
            <input type="checkbox" checked={newActive} onChange={(e) => setNewActive(e.target.checked)} />
            활성
          </label>
        </div>
        <Button disabled={createReward.isPending} onClick={() => createReward.mutate()}>
          {createReward.isPending ? '생성 중…' : '새 보상 추가'}
        </Button>
      </Card>

      <Card className="space-y-2">
        {(catalog ?? []).map((r) => (
          <div key={r.id} className="rounded-2xl border border-slate-200 p-3">
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="제목"
                value={r.title}
                onChange={(e) =>
                  setCatalog((prev) => prev.map((x) => (x.id === r.id ? { ...x, title: e.target.value } : x)))
                }
              />
              <Input
                label="가격(P)"
                type="number"
                value={r.cost_points}
                onChange={(e) =>
                  setCatalog((prev) => prev.map((x) => (x.id === r.id ? { ...x, cost_points: Number(e.target.value) } : x)))
                }
              />
              <Input
                label="재고"
                type="number"
                value={r.inventory ?? ''}
                onChange={(e) =>
                  setCatalog((prev) =>
                    prev.map((x) => (x.id === r.id ? { ...x, inventory: e.target.value === '' ? null : Number(e.target.value) } : x)),
                  )
                }
              />
              <label className="flex items-end gap-2 pb-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={r.is_active}
                  onChange={(e) =>
                    setCatalog((prev) => prev.map((x) => (x.id === r.id ? { ...x, is_active: e.target.checked } : x)))
                  }
                />
                활성
              </label>
            </div>
            <div className="mt-2 flex justify-end">
              <Button
                variant="secondary"
                disabled={patchReward.isPending}
                onClick={() =>
                  patchReward.mutate({
                    id: r.id,
                    title: r.title,
                    cost_points: r.cost_points,
                    inventory: r.inventory,
                    is_active: r.is_active,
                  })
                }
              >
                저장
              </Button>
            </div>
          </div>
        ))}
        {(catalog ?? []).length === 0 ? <div className="text-sm text-slate-500">없음</div> : null}
      </Card>

      <Card className="space-y-2">
        <div className="text-sm font-semibold text-slate-900">보상 교환 처리(데모)</div>
        <Textarea label="처리 노트(선택)" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
      </Card>

      <Card className="space-y-2">
        {(redemptionsQuery.data ?? []).map((r) => (
          <div key={r.id} className="rounded-2xl border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <Badge tone="indigo">{r.status}</Badge>
              <div className="text-xs text-slate-500">{new Date(r.requested_at).toLocaleString()}</div>
            </div>
            <div className="mt-1 text-xs text-slate-500">user: {r.user_id}</div>
            <div className="mt-1 text-xs text-slate-500">reward: {r.reward_id}</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button variant="secondary" disabled={decideMutation.isPending} onClick={() => decideMutation.mutate({ id: r.id, approve: true })}>
                승인
              </Button>
              <Button variant="danger" disabled={decideMutation.isPending} onClick={() => decideMutation.mutate({ id: r.id, approve: false })}>
                반려
              </Button>
            </div>
            {r.note ? <div className="mt-2 text-sm text-slate-700">note: {r.note}</div> : null}
          </div>
        ))}
        {(redemptionsQuery.data ?? []).length === 0 ? <div className="text-sm text-slate-500">없음</div> : null}
      </Card>
    </div>
  )
}
