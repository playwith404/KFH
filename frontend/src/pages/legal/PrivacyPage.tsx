import { Link } from 'react-router-dom'

import { Card } from '../../components/ui/Card'

export function PrivacyPage() {
  return (
    <div className="space-y-3">
      <Link to="/" className="text-sm font-semibold text-indigo-600">
        ← 홈
      </Link>

      <Card className="space-y-2">
        <div className="text-sm font-semibold text-slate-900">개인정보 처리방침(데모)</div>
        <div className="text-sm text-slate-700">
          본 페이지는 공모전/데모용 처리방침 화면입니다. 실제 운영 시 수집 항목/보관 기간/파기 정책을 명시하세요.
        </div>
        <div className="text-xs text-slate-500">
          데모 원칙: 실명정보는 최소화(또는 별도 저장), 화면/API에서는 마스킹 값 위주 제공, 접근 로그는 전수 기록.
        </div>
      </Card>
    </div>
  )
}

