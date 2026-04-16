import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { api } from '../api/client'
import { useAuthStore } from '../stores/auth'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'

type LoginResponse = {
  access_token: string
  expires_in: number
  refresh_token: string
  me: { id: string; email: string; role: 'HUNTER' | 'POLICE' | 'ADMIN'; status: 'ACTIVE' | 'SUSPENDED' | 'DELETED' }
}

export function LoginPage() {
  const navigate = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)
  const setMe = useAuthStore((s) => s.setMe)

  const [email, setEmail] = useState('hunter@kph.pjcloud.store')
  const [password, setPassword] = useState('hunter1234')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await api.post<LoginResponse>('/auth/login', { email, password })
      setTokens(res.data.access_token, res.data.refresh_token)
      setMe(res.data.me)

      if (res.data.me.role === 'HUNTER') {
        const status = await api.get('/onboarding/status')
        if (!status.data?.hunter_verified) {
          navigate('/onboarding/identity', { replace: true })
          return
        }
        navigate('/app/dashboard', { replace: true })
        return
      }

      navigate('/console/reports', { replace: true })
    } catch (err: any) {
      setError(err?.response?.data?.detail || '로그인에 실패했어요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mb-6">
        <div className="text-xs font-semibold text-indigo-600">로그인</div>
        <div className="mt-1 text-xl font-extrabold text-slate-900">헌터 터미널</div>
        <div className="mt-2 text-xs text-slate-500">
          데모 계정: hunter@kph.pjcloud.store / hunter1234 (admin@kph.pjcloud.store / admin1234, police@kph.pjcloud.store / police1234)
        </div>
      </div>

      <Card>
        <form className="space-y-3" onSubmit={onSubmit}>
          <Input label="이메일" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          <Input
            label="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
          />
          {error ? <div className="text-sm font-medium text-rose-600">{error}</div> : null}
          <Button className="w-full" disabled={loading}>
            {loading ? '로그인 중…' : '로그인'}
          </Button>
        </form>
      </Card>

      <div className="mt-6 flex items-center justify-between text-sm">
        <Link to="/" className="text-slate-600">
          ← 홈
        </Link>
        <Link to="/auth/register" className="font-semibold text-indigo-600">
          회원가입
        </Link>
      </div>
    </div>
  )
}
