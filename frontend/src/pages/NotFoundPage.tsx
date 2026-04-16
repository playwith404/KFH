import { Link } from 'react-router-dom'

import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="min-h-screen px-4 py-10">
      <Card className="space-y-3">
        <div className="text-sm font-semibold text-slate-900">페이지를 찾을 수 없어요</div>
        <div className="text-sm text-slate-600">주소가 올바른지 확인해 주세요.</div>
        <Link to="/" className="block">
          <Button className="w-full">홈으로</Button>
        </Link>
      </Card>
    </div>
  )
}

