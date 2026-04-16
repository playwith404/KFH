import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import { useOnboardingStatusQuery } from '../../api/hooks'
import { MobileFrame } from '../../components/layout/MobileFrame'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'

function StepLine({
  label,
  done,
  active,
}: {
  label: string
  done: boolean
  active: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <div className={['text-xs font-medium', active ? 'text-slate-900' : 'text-slate-500'].join(' ')}>{label}</div>
      {done ? <Badge tone="green">완료</Badge> : <Badge tone={active ? 'indigo' : 'gray'}>진행</Badge>}
    </div>
  )
}

export function OnboardingRootPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const statusQuery = useOnboardingStatusQuery(true)

  const path = location.pathname
  const active = (p: string) => path === p
  const status = statusQuery.data

  const nextPath = (() => {
    if (!status) return '/onboarding/identity'
    if (!status.identity_verified) return '/onboarding/identity'
    if (!status.training_completed) return '/onboarding/training'
    if (!status.test_passed) return '/onboarding/test'
    if (!status.oath_signed) return '/onboarding/oath'
    if (status.hunter_verified) return '/onboarding/identity'
    return '/onboarding/certificate'
  })()

  return (
    <MobileFrame>
      <div className="min-h-screen bg-white">
        <div className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-3">
          <div className="text-xs font-semibold text-indigo-600">온보딩</div>
          <div className="text-sm font-bold text-slate-900">명예 케피헌 임명 절차</div>
        </div>

        <div className="space-y-3 px-4 py-4">
          <Card className="space-y-2">
            <StepLine label="1) 실명 인증(데모)" done={Boolean(status?.identity_verified)} active={active('/onboarding/identity')} />
            <StepLine label="2) 온라인 교육" done={Boolean(status?.training_completed)} active={active('/onboarding/training')} />
            <StepLine label="3) 피싱 대응 테스트" done={Boolean(status?.test_passed)} active={active('/onboarding/test')} />
            <StepLine label="4) 서약서 서명" done={Boolean(status?.oath_signed)} active={active('/onboarding/oath')} />
            <StepLine label="5) 자격증 발급" done={Boolean(status?.hunter_verified)} active={active('/onboarding/certificate')} />
          </Card>

          <Button variant="ghost" className="w-full" onClick={() => navigate(nextPath)}>
            다음 단계로 이동
          </Button>

          <Outlet />
        </div>
      </div>
    </MobileFrame>
  )
}
