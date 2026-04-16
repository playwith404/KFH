import { Link } from 'react-router-dom'

import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col justify-between px-4 py-10">
      <div className="space-y-4">
        <div className="text-xs font-semibold tracking-wide text-indigo-600">K-Phishing Hunterz</div>
        <h1 className="text-2xl font-extrabold leading-tight text-slate-900">
          실전처럼 연습하고,
          <br />
          안전하게 대응하자.
        </h1>
        <p className="text-sm text-slate-600">
          보이스피싱·스캠을 역으로 낚아 정보를 수집하고, 데이터 오염으로 범죄 생태계의 경제성을 무너뜨리는 시민 참여형 플랫폼.
        </p>

        <Card className="space-y-2">
          <div className="text-sm font-semibold text-slate-900">데모 웹 버전</div>
          <div className="text-xs text-slate-600">
            웹이지만 모바일 앱처럼 동작하도록 모바일 레이아웃으로 구성했습니다.
          </div>
        </Card>
      </div>

      <div className="space-y-3">
        <Link to="/auth/login" className="block">
          <Button className="w-full">로그인</Button>
        </Link>
        <Link to="/auth/register" className="block">
          <Button variant="ghost" className="w-full">
            헌터 지원(회원가입)
          </Button>
        </Link>
        <div className="text-center text-xs text-slate-500">운영 도메인: kph.pjcloud.store</div>
        <div className="flex items-center justify-center gap-3 text-xs text-slate-500">
          <Link to="/legal/terms" className="hover:text-slate-700">
            이용약관
          </Link>
          <span className="opacity-40">|</span>
          <Link to="/legal/privacy" className="hover:text-slate-700">
            개인정보 처리방침
          </Link>
        </div>
      </div>
    </div>
  )
}
