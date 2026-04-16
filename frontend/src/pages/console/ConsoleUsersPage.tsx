import { useMutation, useQuery } from '@tanstack/react-query'

import { api } from '../../api/client'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Select } from '../../components/ui/Select'

export function ConsoleUsersPage() {
  const usersQuery = useQuery({
    queryKey: ['console', 'users'],
    queryFn: async () => {
      const res = await api.get<any[]>('/console/users')
      return res.data
    },
  })

  const patchMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      await api.patch(`/console/users/${id}`, { role })
    },
    onSuccess: async () => {
      await usersQuery.refetch()
    },
  })

  return (
    <div className="space-y-3">
      <Card>
        <div className="text-sm font-semibold text-slate-900">사용자 관리(데모)</div>
        <div className="mt-1 text-xs text-slate-500">권한 변경은 데모 편의를 위해 제공됩니다.</div>
      </Card>

      <Card className="space-y-2">
        {(usersQuery.data ?? []).map((u) => (
          <div key={u.id} className="rounded-2xl border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900">{u.email}</div>
                <div className="text-xs text-slate-500">{u.id}</div>
              </div>
              <Badge tone="indigo">{u.role}</Badge>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Select
                label="역할"
                defaultValue={u.role}
                onChange={(e) => patchMutation.mutate({ id: u.id, role: e.target.value })}
              >
                <option value="HUNTER">HUNTER</option>
                <option value="POLICE">POLICE</option>
                <option value="ADMIN">ADMIN</option>
              </Select>
              <Button variant="ghost" disabled>
                상태: {u.status}
              </Button>
            </div>
          </div>
        ))}
        {(usersQuery.data ?? []).length === 0 ? <div className="text-sm text-slate-500">없음</div> : null}
      </Card>
    </div>
  )
}

