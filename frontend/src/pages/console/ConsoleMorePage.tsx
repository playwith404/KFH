import { Link } from 'react-router-dom'

import { Card } from '../../components/ui/Card'

function NavRow({ to, title, desc }: { to: string; title: string; desc: string }) {
  return (
    <Link to={to} className="block rounded-2xl border border-slate-200 px-3 py-3">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-xs text-slate-500">{desc}</div>
    </Link>
  )
}

export function ConsoleMorePage() {
  return (
    <div className="space-y-3">
      <Card className="space-y-2">
        <div className="text-sm font-semibold text-slate-900">더보기</div>
        <div className="text-xs text-slate-500">데모 운영/관리 기능입니다.</div>
      </Card>

      <Card className="space-y-2">
        <NavRow to="/console/content" title="콘텐츠 관리" desc="교육/테스트/서약 문서 편집" />
        <NavRow to="/console/audit" title="감사 로그" desc="POLICE/ADMIN 주요 행동 기록 조회" />
        <NavRow to="/console/simulate" title="세션 시뮬레이터" desc="사냥 세션/메시지 생성(데모)" />
      </Card>
    </div>
  )
}

