import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'

import { api } from '../../api/client'
import { useAuthStore } from '../../stores/auth'
import { useOnboardingStatusQuery } from '../../api/hooks'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'

export function ProfilePage() {
  const navigate = useNavigate()
  const me = useAuthStore((s) => s.me)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const clear = useAuthStore((s) => s.clear)

  const onboardingQuery = useOnboardingStatusQuery(Boolean(me?.role === 'HUNTER'))

  const sessionsQuery = useQuery({
    queryKey: ['auth', 'sessions'],
    queryFn: async () => {
      const res = await api.get<any[]>('/auth/sessions')
      return res.data
    },
  })

  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        await api.post('/auth/logout', { refresh_token: refreshToken })
      }
    },
    onSuccess: () => {
      clear()
      navigate('/', { replace: true })
    },
    onError: () => {
      clear()
      navigate('/', { replace: true })
    },
  })

  return (
    <div className="space-y-3">
      <Card className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">내 정보</div>
          {me ? <Badge tone="indigo">{me.role}</Badge> : null}
        </div>
        {me ? (
          <div className="text-sm text-slate-700">
            <div className="font-semibold">{me.email}</div>
            <div className="text-xs text-slate-500">user_id: {me.id}</div>
          </div>
        ) : null}
        {me?.role === 'HUNTER' ? (
          <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
            <div className="text-xs font-semibold text-slate-500">온보딩 상태</div>
            <div className="mt-1">
              {onboardingQuery.data?.hunter_verified ? (
                <Badge tone="green">인증 완료</Badge>
              ) : (
                <Badge tone="yellow">미완료</Badge>
              )}
            </div>
          </div>
        ) : null}
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Link to="/app/rewards" className="block rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-semibold text-slate-900">포인트/보상</div>
          <div className="mt-1 text-xs text-slate-500">교환 신청</div>
        </Link>
        <Link to="/app/ranking" className="block rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-semibold text-slate-900">랭킹</div>
          <div className="mt-1 text-xs text-slate-500">명예의 전당</div>
        </Link>
        <Link to="/app/global" className="block rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-semibold text-slate-900">오염 현황</div>
          <div className="mt-1 text-xs text-slate-500">지표/지도</div>
        </Link>
        <Link to="/app/notifications" className="block rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-semibold text-slate-900">알림</div>
          <div className="mt-1 text-xs text-slate-500">알림센터</div>
        </Link>
      </div>

      <Card className="space-y-2">
        <div className="text-sm font-semibold text-slate-900">로그인 세션</div>
        {(sessionsQuery.data ?? []).map((s: any) => (
          <div key={s.id} className="rounded-2xl border border-slate-200 px-3 py-2">
            <div className="flex items-center justify-between">
              <Badge tone={s.revoked_at ? 'gray' : 'green'}>{s.revoked_at ? '폐기' : '활성'}</Badge>
              <div className="text-xs text-slate-500">{new Date(s.created_at).toLocaleString()}</div>
            </div>
            <div className="mt-1 text-xs text-slate-500">{s.ip ?? ''}</div>
          </div>
        ))}
        {(sessionsQuery.data ?? []).length === 0 ? <div className="text-sm text-slate-500">세션 정보가 없어요.</div> : null}
      </Card>

      <Button variant="danger" className="w-full" disabled={logoutMutation.isPending} onClick={() => logoutMutation.mutate()}>
        {logoutMutation.isPending ? '로그아웃 중…' : '로그아웃'}
      </Button>

      {me?.role !== 'HUNTER' ? (
        <Link to="/console/reports" className="block text-center text-sm font-semibold text-indigo-600">
          콘솔로 이동 →
        </Link>
      ) : null}
    </div>
  )
}

