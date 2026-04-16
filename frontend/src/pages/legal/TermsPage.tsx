import { Link } from 'react-router-dom'

import { Card } from '../../components/ui/Card'

export function TermsPage() {
  return (
    <div className="space-y-3">
      <Link to="/" className="text-sm font-semibold text-indigo-600">
        ← 홈
      </Link>

      <Card className="space-y-2">
        <div className="text-sm font-semibold text-slate-900">이용약관(데모)</div>
        <div className="text-sm text-slate-700">
          본 페이지는 공모전/데모용 약관 화면입니다. 실제 운영 시 법무 검토된 약관으로 교체하세요.
        </div>
        <div className="text-xs text-slate-500">
          핵심: 허위 신고 금지, 금지된 활동(해킹/침입) 금지, 개인정보 최소 수집/마스킹, 활동 로그 감사 기록.
        </div>
      </Card>
    </div>
  )
}

