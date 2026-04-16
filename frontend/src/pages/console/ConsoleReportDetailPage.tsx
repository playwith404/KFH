import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'

import { api } from '../../api/client'
import type { HuntSessionDetail, ReportDetail } from '../../api/types'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Textarea } from '../../components/ui/Textarea'

export function ConsoleReportDetailPage() {
  const { reportId } = useParams()
  const [commentPublic, setCommentPublic] = useState('')
  const [commentInternal, setCommentInternal] = useState('')
  const [error, setError] = useState<string | null>(null)

  const reportQuery = useQuery({
    queryKey: ['console', 'report', reportId],
    queryFn: async () => {
      const res = await api.get<ReportDetail>(`/reports/${reportId}`)
      return res.data
    },
    enabled: Boolean(reportId),
  })

  const transcriptQuery = useQuery({
    queryKey: ['console', 'report', reportId, 'transcript'],
    queryFn: async () => {
      const res = await api.get<any[]>(`/reports/${reportId}/transcript`)
      return res.data
    },
    enabled: Boolean(reportId),
  })

  const sessionQuery = useQuery({
    queryKey: ['console', 'report', reportId, 'session'],
    queryFn: async () => {
      const report = reportQuery.data
      if (!report) throw new Error('No report')
      const res = await api.get<HuntSessionDetail>(`/hunt/sessions/${report.session_id}`)
      return res.data
    },
    enabled: Boolean(reportQuery.data?.session_id),
  })

  const decideMutation = useMutation({
    mutationFn: async (decision: 'APPROVE' | 'REJECT' | 'MONITOR' | 'REQUEST_MORE') => {
      await api.post(`/console/reports/${reportId}/decision`, {
        decision,
        comment_public: commentPublic || null,
        comment_internal: commentInternal || null,
      })
    },
    onSuccess: async () => {
      setError(null)
      await reportQuery.refetch()
    },
    onError: (err: any) => setError(err?.response?.data?.detail || '처리에 실패했어요.'),
  })

  const r = reportQuery.data

  return (
    <div className="space-y-3">
      <Link to="/console/reports" className="text-sm font-semibold text-indigo-600">
        ← 신고 큐
      </Link>

      {r ? (
        <Card className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900">신고</div>
            <Badge tone="indigo">{r.status}</Badge>
          </div>
          <div className="text-xs text-slate-500">evidence_key: {r.primary_evidence_key ?? '—'}</div>
          <div className="text-xs text-slate-500">
            AI 지표 {r.stage1_indicator_hits}/5 · {r.stage1_pass ? '1차 통과' : '1차 보류'}
          </div>
          {r.hunter_review ? (
            <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
              <div className="text-xs font-semibold text-slate-500">헌터 근거</div>
              <div className="mt-1 whitespace-pre-wrap">{r.hunter_review.rationale_text}</div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">헌터 2차 검증이 아직 제출되지 않았어요.</div>
          )}
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
          <div className="text-sm text-slate-500">없음</div>
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
          {(transcriptQuery.data ?? []).length === 0 ? <div className="text-sm text-slate-500">없음</div> : null}
        </div>
      </Card>

      <Card className="space-y-3">
        <div className="text-sm font-semibold text-slate-900">결정</div>
        <Textarea label="헌터에게 공개 코멘트(선택)" value={commentPublic} onChange={(e) => setCommentPublic(e.target.value)} rows={3} />
        <Textarea label="내부 코멘트(선택)" value={commentInternal} onChange={(e) => setCommentInternal(e.target.value)} rows={3} />
        {error ? <div className="text-sm font-medium text-rose-600">{error}</div> : null}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" disabled={decideMutation.isPending} onClick={() => decideMutation.mutate('APPROVE')}>
            승인
          </Button>
          <Button variant="danger" disabled={decideMutation.isPending} onClick={() => decideMutation.mutate('REJECT')}>
            반려
          </Button>
          <Button variant="ghost" disabled={decideMutation.isPending} onClick={() => decideMutation.mutate('MONITOR')}>
            모니터링
          </Button>
          <Button variant="ghost" disabled={decideMutation.isPending} onClick={() => decideMutation.mutate('REQUEST_MORE')}>
            추가요청
          </Button>
        </div>
        <div className="text-xs text-slate-500">승인 시 신고자에게 +300P가 적립됩니다(데모).</div>
      </Card>
    </div>
  )
}

