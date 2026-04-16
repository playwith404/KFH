import { useMutation, useQuery } from '@tanstack/react-query'

import { api } from '../../api/client'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

export function NotificationsPage() {
  const notesQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get<any[]>('/notifications')
      return res.data
    },
  })

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/notifications/${id}/read`, {})
    },
    onSuccess: async () => {
      await notesQuery.refetch()
    },
  })

  return (
    <div className="space-y-3">
      <Card>
        <div className="text-sm font-semibold text-slate-900">알림센터</div>
        <div className="mt-1 text-xs text-slate-500">데모에서는 일부 알림만 생성될 수 있어요.</div>
      </Card>

      <Card className="space-y-2">
        {(notesQuery.data ?? []).map((n: any) => (
          <div key={n.id} className="rounded-2xl border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <Badge tone={n.read_at ? 'gray' : 'indigo'}>{n.type}</Badge>
              <div className="text-xs text-slate-500">{new Date(n.created_at).toLocaleString()}</div>
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{n.title}</div>
            <div className="mt-1 text-sm text-slate-700">{n.body}</div>
            {!n.read_at ? (
              <div className="mt-2">
                <Button variant="ghost" disabled={markRead.isPending} onClick={() => markRead.mutate(n.id)}>
                  읽음 처리
                </Button>
              </div>
            ) : null}
          </div>
        ))}
        {(notesQuery.data ?? []).length === 0 ? <div className="text-sm text-slate-500">알림이 없어요.</div> : null}
      </Card>
    </div>
  )
}

