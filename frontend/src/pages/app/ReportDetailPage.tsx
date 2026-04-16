import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'

import { api } from '../../api/client'
import type { HuntSessionDetail, ReportDetail } from '../../api/types'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Textarea } from '../../components/ui/Textarea'

const checklistItems = [
  '상대방이 먼저 연락해왔는가?',
  '선입금을 요구했는가?',
  '의심스러운 링크를 발송했는가?',
  '다른 메신저로 이동을 유도했는가?',
  '급하게 결정을 요구했는가?',
  '신원 확인을 회피했는가?',
  '계좌번호 또는 개인정보를 요구했는가?',
  '대화 내용이 전형적인 사기 수법과 일치하는가?',
]

export function ReportDetailPage() {
  const { reportId } = useParams()
  const [checks, setChecks] = useState<Record<string, boolean>>({
    c1: false,
    c2: false,
    c3: false,
    c4: false,
    c5: false,
    c6: false,
    c7: false,
    c8: false,
  })
  const [rationale, setRationale] = useState('')
  const [error, setError] = useState<string | null>(null)

  const reportQuery = useQuery({
    queryKey: ['reports', reportId],
    queryFn: async () => {
      const res = await api.get<ReportDetail>(`/reports/${reportId}`)
      return res.data
    },
    enabled: Boolean(reportId),
  })

  const transcriptQuery = useQuery({
    queryKey: ['reports', reportId, 'transcript'],
    queryFn: async () => {
      const res = await api.get<any[]>(`/reports/${reportId}/transcript`)
      return res.data
    },
    enabled: Boolean(reportId),
  })

  const sessionQuery = useQuery({
    queryKey: ['reports', reportId, 'session'],
    queryFn: async () => {
      const report = reportQuery.data
      if (!report) throw new Error('No report')
      const res = await api.get<HuntSessionDetail>(`/hunt/sessions/${report.session_id}`)
      return res.data
    },
    enabled: Boolean(reportQuery.data?.session_id),
  })

  const submitMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/reports/${reportId}/hunter-review`, {
        checklist: checks,
        rationale_text: rationale,
      })
    },
    onSuccess: async () => {
      await reportQuery.refetch()
      setError(null)
    },
    onError: (err: any) => setError(err?.response?.data?.detail || '제출에 실패했어요.'),
  })

  const report = reportQuery.data
  const canSubmit = useMemo(() => {
    const all = Object.values(checks).every(Boolean)
    return all && rationale.trim().length >= 10 && (report?.hunter_review == null)
  }, [checks, rationale, report?.hunter_review])

  return (
    <div className="space-y-3">
      <Link to="/app/reports" className="text-sm font-semibold text-indigo-600">
        ← 신고 목록
      </Link>

      {report ? (
        <Card className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900">신고 상세</div>
            <Badge tone="indigo">{report.status}</Badge>
          </div>
          <div className="text-xs text-slate-500">증거 키: {report.primary_evidence_key ?? '—'}</div>
          <div className="text-xs text-slate-500">
            AI 지표 {report.stage1_indicator_hits}/5 · {report.stage1_pass ? '1차 통과' : '1차 보류'}
          </div>
          {report.police_decision ? (
            <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
              <div className="text-xs font-semibold text-slate-500">경찰 결정</div>
              <div className="mt-1 font-semibold">{String(report.police_decision.decision)}</div>
              {report.police_decision.comment_public ? (
                <div className="mt-1">{report.police_decision.comment_public}</div>
              ) : null}
            </div>
          ) : null}
        </Card>
      ) : (
        <Card>불러오는 중…</Card>
      )}

      <Card className="space-y-2">
        <div className="text-sm font-semibold text-slate-900">추출 정보</div>
        {sessionQuery.data?.extracted_entities?.length ? (
          <div className="space-y-2">
            {sessionQuery.data.extracted_entities.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-3 py-2">
                <div className="min-w-0">
                  <div className="text-xs text-slate-500">{e.entity_type}</div>
                  <div className="truncate text-sm font-semibold text-slate-900">{e.value_masked}</div>
                </div>
                <Badge>{Math.round(e.confidence * 100)}%</Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-500">추출 정보가 없어요.</div>
        )}
      </Card>

      <Card className="space-y-2">
        <div className="text-sm font-semibold text-slate-900">대화 전문</div>
        <div className="max-h-[320px] space-y-2 overflow-auto rounded-2xl bg-slate-50 p-3 text-sm">
          {(transcriptQuery.data ?? []).map((m) => (
            <div key={m.id} className="rounded-2xl bg-white px-3 py-2">
              <div className="text-xs font-semibold text-slate-500">{m.sender}</div>
              <div className="mt-1 whitespace-pre-wrap text-slate-800">{m.content_text}</div>
            </div>
          ))}
          {(transcriptQuery.data ?? []).length === 0 ? (
            <div className="text-sm text-slate-500">표시할 대화가 없어요.</div>
          ) : null}
        </div>
      </Card>

      <Card className="space-y-3">
        <div className="text-sm font-semibold text-slate-900">2차 검증 체크리스트</div>

        {report?.hunter_review ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            이미 제출된 신고예요.
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {checklistItems.map((text, idx) => {
                const key = `c${idx + 1}`
                return (
                  <label
                    key={key}
                    className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={checks[key]}
                      onChange={(e) => setChecks((prev) => ({ ...prev, [key]: e.target.checked }))}
                    />
                    <span>{text}</span>
                  </label>
                )
              })}
            </div>

            <Textarea
              label="신고 근거(자유서술, 10자 이상)"
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              rows={4}
              placeholder="대화 내용이 전형적인 사기 수법과 일치하며, 계좌/링크 유도가 확인됩니다."
            />

            {error ? <div className="text-sm font-medium text-rose-600">{error}</div> : null}

            <Button
              className="w-full"
              disabled={!canSubmit || submitMutation.isPending}
              onClick={() => {
                setError(null)
                submitMutation.mutate()
              }}
            >
              {submitMutation.isPending ? '제출 중…' : '신고 요청 제출'}
            </Button>
          </>
        )}
      </Card>
    </div>
  )
}
