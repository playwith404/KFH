import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'

import { api } from '../../api/client'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'

type Certificate = {
  hunter_number: string | null
  level: string | null
  issued_at: string | null
  card_title: string
}

export function OnboardingCertificatePage() {
  const navigate = useNavigate()
  const certQuery = useQuery({
    queryKey: ['hunters', 'certificate'],
    queryFn: async () => {
      const res = await api.get<Certificate>('/hunters/certificate')
      return res.data
    },
  })

  useEffect(() => {
    if (!certQuery.data?.issued_at) return
    const timer = window.setTimeout(() => {
      navigate('/onboarding/identity', { replace: true })
    }, 800)
    return () => window.clearTimeout(timer)
  }, [certQuery.data?.issued_at, navigate])

  return (
    <Card className="space-y-3">
      <div className="text-sm font-semibold text-slate-900">임명/자격증</div>
      <div className="text-xs text-slate-600">온보딩이 완료되면 자격증이 발급됩니다.</div>

      {certQuery.isLoading ? <div className="text-sm text-slate-600">불러오는 중…</div> : null}
      {certQuery.isError ? <div className="text-sm text-rose-600">자격증을 불러오지 못했어요.</div> : null}

      {certQuery.data ? (
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-indigo-50 to-white p-4">
          <div className="text-xs font-semibold text-indigo-600">{certQuery.data.card_title}</div>
          <div className="mt-1 text-xl font-extrabold text-slate-900">{certQuery.data.hunter_number ?? '—'}</div>
          <div className="mt-2 flex items-center gap-2">
            <Badge tone="indigo">{certQuery.data.level ?? 'TRAINEE'}</Badge>
            <div className="text-xs text-slate-500">{certQuery.data.issued_at ?? ''}</div>
          </div>
        </div>
      ) : null}

      {certQuery.data?.issued_at ? (
        <div className="text-xs font-medium text-indigo-600">자격증 발급이 완료되어 실명인증 단계로 이동합니다.</div>
      ) : null}

      <Link to="/onboarding/identity" className="block">
        <Button className="w-full">실명인증 단계로 이동</Button>
      </Link>
    </Card>
  )
}
