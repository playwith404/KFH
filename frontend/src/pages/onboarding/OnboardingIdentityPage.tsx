import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { api } from '../../api/client'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

export function OnboardingIdentityPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [birthdate, setBirthdate] = useState('1980-01-01')
  const [phone, setPhone] = useState('010-0000-0000')
  const [demoCode, setDemoCode] = useState('000000')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await api.post('/onboarding/identity/verify', {
        name,
        birthdate,
        phone,
        demo_code: demoCode,
      })
      navigate('/onboarding/training')
    } catch (err: any) {
      setError(err?.response?.data?.detail || '실명 인증에 실패했어요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="space-y-3">
      <div className="text-sm font-semibold text-slate-900">실명 인증 (데모)</div>
      <div className="text-xs text-slate-600">
        데모에서는 외부 본인인증 연동 없이, 입력값과 데모 코드로 인증을 완료합니다.
      </div>
      <form className="space-y-3" onSubmit={onSubmit}>
        <Input label="이름" value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" />
        <Input label="생년월일 (YYYY-MM-DD)" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} />
        <Input label="휴대폰" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input label="데모 코드" value={demoCode} onChange={(e) => setDemoCode(e.target.value)} />
        {error ? <div className="text-sm font-medium text-rose-600">{error}</div> : null}
        <Button className="w-full" disabled={loading}>
          {loading ? '확인 중…' : '인증 완료'}
        </Button>
      </form>
    </Card>
  )
}

