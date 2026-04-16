import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'

import { api } from '../../api/client'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'

type TrainingModule = {
  id: string | null
  title: string
  duration_seconds: number
  is_active: boolean
}

type TestQuestion = {
  id?: string
  question_text: string
  options: string[]
  correct_index: number
}

type TestContent = {
  id: string
  code: string
  title: string
  is_active: boolean
  questions: Array<{
    id: string
    question_text: string
    options: string[]
    correct_index: number
  }>
}

type OathContent = {
  id: string
  version: number
  content_md: string
  published_at: string
}

export function ConsoleContentPage() {
  const trainingQuery = useQuery({
    queryKey: ['console', 'content', 'training'],
    queryFn: async () => (await api.get<TrainingModule[]>('/console/content/training')).data,
  })

  const testsQuery = useQuery({
    queryKey: ['console', 'content', 'tests'],
    queryFn: async () => (await api.get<TestContent>('/console/content/tests')).data,
  })

  const oathQuery = useQuery({
    queryKey: ['console', 'content', 'oaths'],
    queryFn: async () => (await api.get<OathContent>('/console/content/oaths')).data,
  })

  const [training, setTraining] = useState<TrainingModule[]>([])
  const [testTitle, setTestTitle] = useState('')
  const [testActive, setTestActive] = useState(true)
  const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([])
  const [oathMd, setOathMd] = useState('')

  useEffect(() => {
    if (trainingQuery.data) setTraining(trainingQuery.data)
  }, [trainingQuery.data])

  useEffect(() => {
    const t = testsQuery.data
    if (!t) return
    setTestTitle(t.title)
    setTestActive(Boolean(t.is_active))
    setTestQuestions(
      (t.questions ?? []).map((q) => ({
        id: q.id,
        question_text: q.question_text,
        options: q.options ?? [],
        correct_index: q.correct_index ?? 0,
      })),
    )
  }, [testsQuery.data])

  useEffect(() => {
    const o = oathQuery.data
    if (!o) return
    setOathMd(o.content_md ?? '')
  }, [oathQuery.data])

  const saveTraining = useMutation({
    mutationFn: async () => {
      await api.put('/console/content/training', training.map((m) => ({ ...m, id: m.id || null })))
    },
    onSuccess: async () => trainingQuery.refetch(),
  })

  const saveTests = useMutation({
    mutationFn: async () => {
      await api.put('/console/content/tests', {
        title: testTitle,
        is_active: testActive,
        questions: testQuestions.map((q) => ({
          question_text: q.question_text,
          options: q.options,
          correct_index: q.correct_index,
        })),
      })
    },
    onSuccess: async () => testsQuery.refetch(),
  })

  const saveOath = useMutation({
    mutationFn: async () => {
      await api.put('/console/content/oaths', { content_md: oathMd })
    },
    onSuccess: async () => oathQuery.refetch(),
  })

  const totalTrainingMinutes = useMemo(
    () => Math.round(training.reduce((acc, m) => acc + (Number(m.duration_seconds) || 0), 0) / 60),
    [training],
  )

  return (
    <div className="space-y-3">
      <Card className="space-y-2">
        <div className="text-sm font-semibold text-slate-900">콘텐츠 관리</div>
        <div className="text-xs text-slate-500">교육/테스트/서약 문서를 데모 기준으로 편집합니다.</div>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">교육 모듈</div>
            <div className="mt-1 text-xs text-slate-500">총 {totalTrainingMinutes}분(데모)</div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() =>
                setTraining((prev) => [...prev, { id: null, title: '새 모듈', duration_seconds: 600, is_active: true }])
              }
            >
              추가
            </Button>
            <Button disabled={saveTraining.isPending} onClick={() => saveTraining.mutate()}>
              {saveTraining.isPending ? '저장 중…' : '저장'}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {training.map((m, idx) => (
            <div key={m.id ?? `new-${idx}`} className="rounded-2xl border border-slate-200 p-3">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="제목"
                  value={m.title}
                  onChange={(e) =>
                    setTraining((prev) => prev.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)))
                  }
                />
                <Input
                  label="길이(초)"
                  type="number"
                  value={m.duration_seconds}
                  onChange={(e) =>
                    setTraining((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, duration_seconds: Number(e.target.value) } : x)),
                    )
                  }
                />
              </div>
              <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={m.is_active}
                  onChange={(e) =>
                    setTraining((prev) => prev.map((x, i) => (i === idx ? { ...x, is_active: e.target.checked } : x)))
                  }
                />
                활성
              </label>
            </div>
          ))}
          {training.length === 0 ? <div className="text-sm text-slate-500">모듈이 없어요.</div> : null}
        </div>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">자격 테스트</div>
          <Button disabled={saveTests.isPending} onClick={() => saveTests.mutate()}>
            {saveTests.isPending ? '저장 중…' : '저장'}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input label="제목" value={testTitle} onChange={(e) => setTestTitle(e.target.value)} />
          <label className="flex items-end gap-2 pb-2 text-sm text-slate-700">
            <input type="checkbox" checked={testActive} onChange={(e) => setTestActive(e.target.checked)} />
            활성
          </label>
        </div>

        <div className="space-y-2">
          {testQuestions.map((q, idx) => (
            <div key={q.id ?? `q-${idx}`} className="rounded-2xl border border-slate-200 p-3">
              <Input
                label={`문항 #${idx + 1}`}
                value={q.question_text}
                onChange={(e) =>
                  setTestQuestions((prev) => prev.map((x, i) => (i === idx ? { ...x, question_text: e.target.value } : x)))
                }
              />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Input
                  label="보기(,로 구분)"
                  value={(q.options ?? []).join(', ')}
                  onChange={(e) =>
                    setTestQuestions((prev) =>
                      prev.map((x, i) =>
                        i === idx ? { ...x, options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) } : x,
                      ),
                    )
                  }
                />
                <Input
                  label="정답 인덱스(0부터)"
                  type="number"
                  value={q.correct_index}
                  onChange={(e) =>
                    setTestQuestions((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, correct_index: Number(e.target.value) } : x)),
                    )
                  }
                />
              </div>
              <div className="mt-2 flex justify-end">
                <Button
                  variant="ghost"
                  onClick={() => setTestQuestions((prev) => prev.filter((_, i) => i !== idx))}
                >
                  삭제
                </Button>
              </div>
            </div>
          ))}
          <Button
            variant="ghost"
            onClick={() =>
              setTestQuestions((prev) => [...prev, { question_text: '새 문항', options: ['예', '아니오'], correct_index: 0 }])
            }
          >
            문항 추가
          </Button>
        </div>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">서약서</div>
          <Button disabled={saveOath.isPending} onClick={() => saveOath.mutate()}>
            {saveOath.isPending ? '발행 중…' : '새 버전 발행'}
          </Button>
        </div>
        <Textarea label="내용(Markdown)" value={oathMd} onChange={(e) => setOathMd(e.target.value)} rows={10} />
        <div className="text-xs text-slate-500">저장 시 새 버전으로 발행됩니다.</div>
      </Card>
    </div>
  )
}

