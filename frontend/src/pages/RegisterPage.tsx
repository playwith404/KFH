import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { api } from '../api/client'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { useAuthStore } from '../stores/auth'

type RegisterResponse = {
  access_token: string
  expires_in: number
  refresh_token: string
  me: { id: string; email: string; role: 'HUNTER' | 'POLICE' | 'ADMIN'; status: 'ACTIVE' | 'SUSPENDED' | 'DELETED' }
}

export function RegisterPage() {
  const navigate = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)
  const setMe = useAuthStore((s) => s.setMe)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await api.post<RegisterResponse>('/auth/register', { email, password })
      setTokens(res.data.access_token, res.data.refresh_token)
      setMe(res.data.me)
      navigate('/onboarding/identity', { replace: true })
    } catch (err: any) {
      setError(err?.response?.data?.detail || '회원가입에 실패했어요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mb-6">
        <div className="text-xs font-semibold text-indigo-600">회원가입</div>
        <div className="mt-1 text-xl font-extrabold text-slate-900">헌터 지원</div>
        <div className="mt-2 text-xs text-slate-500">데모에서는 이메일/비밀번호만으로 가입합니다.</div>
      </div>

      <Card>
        <form className="space-y-3" onSubmit={onSubmit}>
          <Input label="이메일" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          <Input
            label="비밀번호 (8자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
          />
          {error ? <div className="text-sm font-medium text-rose-600">{error}</div> : null}
          <Button className="w-full" disabled={loading}>
            {loading ? '가입 중…' : '가입하고 온보딩 시작'}
          </Button>
        </form>
      </Card>

      <div className="mt-6 flex items-center justify-between text-sm">
        <Link to="/" className="text-slate-600">
          ← 홈
        </Link>
        <Link to="/auth/login" className="font-semibold text-indigo-600">
          로그인
        </Link>
      </div>
    </div>
  )
}
