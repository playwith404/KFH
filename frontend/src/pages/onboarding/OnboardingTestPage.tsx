import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { api } from '../../api/client'
import type { TestOut } from '../../api/types'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'

type SubmitResponse = { score: number; passed: boolean }

export function OnboardingTestPage() {
  const navigate = useNavigate()
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [result, setResult] = useState<SubmitResponse | null>(null)

  const testQuery = useQuery({
    queryKey: ['tests', 'hunter-qualification'],
    queryFn: async () => {
      const res = await api.get<TestOut>('/tests/hunter-qualification')
      return res.data
    },
  })

  const submitMutation = useMutation({
    mutationFn: async () => {
      const test = testQuery.data
      if (!test) throw new Error('No test')
      const payload = {
        test_id: test.id,
        answers: test.questions.map((q) => ({
          question_id: q.id,
          chosen_index: answers[q.id] ?? -1,
        })),
      }
      const res = await api.post<SubmitResponse>('/tests/submit', payload)
      return res.data
    },
    onSuccess: (data) => {
      setResult(data)
      if (data.passed) {
        setTimeout(() => navigate('/onboarding/oath'), 500)
      }
    },
  })

  const test = testQuery.data
  const allAnswered = useMemo(() => {
    if (!test) return false
    return test.questions.every((q) => typeof answers[q.id] === 'number' && answers[q.id] >= 0)
  }, [answers, test])

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">피싱 대응 테스트</div>
          <div className="mt-1 text-xs text-slate-600">10문항 · 80점 이상 통과</div>
        </div>
        {result ? (
          <Badge tone={result.passed ? 'green' : 'red'}>
            {result.score}점 · {result.passed ? '통과' : '실패'}
          </Badge>
        ) : null}
      </div>

      {testQuery.isLoading ? <div className="text-sm text-slate-600">불러오는 중…</div> : null}
      {testQuery.isError ? <div className="text-sm text-rose-600">테스트를 불러오지 못했어요.</div> : null}

      {test ? (
        <div className="space-y-3">
          {test.questions.map((q, idx) => (
            <div key={q.id} className="rounded-2xl border border-slate-200 p-3">
              <div className="text-xs font-semibold text-slate-500">문항 {idx + 1}</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{q.question_text}</div>
              <div className="mt-2 space-y-2">
                {q.options.map((opt, oi) => (
                  <label key={opt} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === oi}
                      onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: oi }))}
                    />
                    <span className="text-sm text-slate-700">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <Button className="w-full" disabled={!allAnswered || submitMutation.isPending} onClick={() => submitMutation.mutate()}>
        {submitMutation.isPending ? '제출 중…' : '제출'}
      </Button>
      {result && !result.passed ? (
        <div className="text-xs text-slate-500">통과하지 못했어요. 다시 선택하고 재제출해 주세요.</div>
      ) : null}
    </Card>
  )
}

