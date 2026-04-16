import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { api } from '../../api/client'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Textarea } from '../../components/ui/Textarea'

type OathOut = { id: string; version: number; content_md: string; published_at: string }

export function OnboardingOathPage() {
  const navigate = useNavigate()
  const [agree, setAgree] = useState(false)
  const [signature, setSignature] = useState('')
  const [error, setError] = useState<string | null>(null)

  const oathQuery = useQuery({
    queryKey: ['oaths', 'current'],
    queryFn: async () => {
      const res = await api.get<OathOut>('/oaths/current')
      return res.data
    },
  })

  const signMutation = useMutation({
    mutationFn: async () => {
      const doc = oathQuery.data
      if (!doc) throw new Error('No oath')
      await api.post('/oaths/sign', { doc_id: doc.id, signature_blob: signature })
    },
    onSuccess: () => navigate('/onboarding/certificate'),
    onError: (err: any) => setError(err?.response?.data?.detail || '서명에 실패했어요.'),
  })

  return (
    <Card className="space-y-3">
      <div className="text-sm font-semibold text-slate-900">서약서 전자서명</div>
      <div className="text-xs text-slate-600">데모에서는 서명 문자열을 입력하면 서명으로 처리합니다.</div>

      {oathQuery.isLoading ? <div className="text-sm text-slate-600">불러오는 중…</div> : null}
      {oathQuery.isError ? <div className="text-sm text-rose-600">서약서를 불러오지 못했어요.</div> : null}

      {oathQuery.data ? (
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
          {oathQuery.data.content_md}
        </pre>
      ) : null}

      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>위 내용을 확인했고, 허위 신고/금지 활동을 하지 않겠습니다.</span>
      </label>

      <Textarea
        label="서명(이름)"
        value={signature}
        onChange={(e) => setSignature(e.target.value)}
        placeholder="홍길동"
        rows={2}
      />

      {error ? <div className="text-sm font-medium text-rose-600">{error}</div> : null}

      <Button
        className="w-full"
        disabled={!agree || signature.trim().length === 0 || signMutation.isPending}
        onClick={() => {
          setError(null)
          signMutation.mutate()
        }}
      >
        {signMutation.isPending ? '서명 중…' : '서약서 서명 완료'}
      </Button>
    </Card>
  )
}

