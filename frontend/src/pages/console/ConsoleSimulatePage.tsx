import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { api } from '../../api/client'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'

export function ConsoleSimulatePage() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [personaType, setPersonaType] = useState('어리숙한 노인')
  const [scammerContact, setScammerContact] = useState('010-1234-5678')

  const [sender, setSender] = useState('SCAMMER')
  const [content, setContent] = useState('안전결제 링크 보내드릴게요 https://example.com/pay')
  const [error, setError] = useState<string | null>(null)

  const createSession = useMutation({
    mutationFn: async () => {
      const res = await api.post<{ id: string }>('/console/hunt/sessions/simulate', {
        persona_type: personaType,
        scammer_contact: scammerContact,
      })
      return res.data
    },
    onSuccess: (data) => {
      setError(null)
      setSessionId(data.id)
    },
    onError: (err: any) => setError(err?.response?.data?.detail || '세션 생성 실패'),
  })

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!sessionId) throw new Error('No session')
      await api.post(`/console/hunt/sessions/${sessionId}/messages`, { sender, content_text: content })
    },
    onSuccess: () => setError(null),
    onError: (err: any) => setError(err?.response?.data?.detail || '메시지 전송 실패'),
  })

  return (
    <div className="space-y-3">
      <Card className="space-y-2">
        <div className="text-sm font-semibold text-slate-900">사냥 세션 시뮬레이터(데모)</div>
        <div className="text-xs text-slate-500">
          주의: 시뮬레이션은 “최근 생성된 미끼”를 사용합니다. 미끼가 없으면 헌터로 로그인하여 미끼를 먼저 발급해 주세요.
        </div>
      </Card>

      <Card className="space-y-3">
        <Input label="페르소나" value={personaType} onChange={(e) => setPersonaType(e.target.value)} />
        <Input label="사기꾼 연락처(선택)" value={scammerContact} onChange={(e) => setScammerContact(e.target.value)} />
        <Button disabled={createSession.isPending} onClick={() => createSession.mutate()}>
          {createSession.isPending ? '생성 중…' : '세션 생성'}
        </Button>

        {sessionId ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">session_id</div>
              <Badge tone="green">ACTIVE</Badge>
            </div>
            <div className="mt-1 break-all text-xs text-slate-600">{sessionId}</div>
            <div className="mt-2">
              <Link to={`/app/hunt/${sessionId}`} className="text-sm font-semibold text-indigo-600">
                관전 화면 열기 →
              </Link>
            </div>
          </div>
        ) : null}
      </Card>

      <Card className="space-y-3">
        <div className="text-sm font-semibold text-slate-900">메시지 전송</div>
        <Select label="발신자" value={sender} onChange={(e) => setSender(e.target.value)}>
          <option value="SCAMMER">SCAMMER</option>
          <option value="AI">AI</option>
          <option value="SYSTEM">SYSTEM</option>
        </Select>
        <Textarea label="내용" value={content} onChange={(e) => setContent(e.target.value)} rows={4} />
        {error ? <div className="text-sm font-medium text-rose-600">{error}</div> : null}
        <Button disabled={!sessionId || sendMessage.isPending} onClick={() => sendMessage.mutate()}>
          {sendMessage.isPending ? '전송 중…' : '전송'}
        </Button>
        <div className="text-xs text-slate-500">
          계좌/URL/전화번호가 포함되면 자동 추출(+100P) 및 의심도 업데이트가 발생합니다.
        </div>
      </Card>
    </div>
  )
}

