import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { api } from '../../api/client'
import type { ExtractedEntity, HuntMessage, HuntSessionDetail } from '../../api/types'
import { WS_BASE_URL } from '../../config'
import { useAuthStore } from '../../stores/auth'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'

type WsEvent =
  | { type: 'message_created'; payload: { id: string; sender: string; content_text: string; created_at: string } }
  | { type: 'entity_extracted'; payload: { entity: { entity_type: string; value_masked: string; confidence: number } } }
  | { type: 'status_updated'; payload: { suspicion_score: number } }
  | { type: string; payload?: any }

export function HuntSessionPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const accessToken = useAuthStore((s) => s.accessToken)

  const [messages, setMessages] = useState<HuntMessage[]>([])
  const [entities, setEntities] = useState<ExtractedEntity[]>([])
  const [suspicion, setSuspicion] = useState<number>(0)
  const wsRef = useRef<WebSocket | null>(null)
  const pingRef = useRef<number | null>(null)

  const sessionQuery = useQuery({
    queryKey: ['hunt', 'session', sessionId],
    queryFn: async () => {
      const res = await api.get<HuntSessionDetail>(`/hunt/sessions/${sessionId}`)
      return res.data
    },
    enabled: Boolean(sessionId),
  })

  const messagesQuery = useQuery({
    queryKey: ['hunt', 'session', sessionId, 'messages'],
    queryFn: async () => {
      const res = await api.get<HuntMessage[]>(`/hunt/sessions/${sessionId}/messages`)
      return res.data
    },
    enabled: Boolean(sessionId),
  })

  useEffect(() => {
    if (messagesQuery.data) setMessages(messagesQuery.data)
  }, [messagesQuery.data])

  useEffect(() => {
    if (sessionQuery.data) {
      setEntities(sessionQuery.data.extracted_entities ?? [])
      setSuspicion(sessionQuery.data.suspicion_score ?? 0)
    }
  }, [sessionQuery.data])

  const createReport = useMutation({
    mutationFn: async () => {
      const res = await api.post<{ id: string }>(`/reports`, { session_id: sessionId })
      return res.data
    },
    onSuccess: (data) => navigate(`/app/reports/${data.id}`),
  })

  useEffect(() => {
    if (!sessionId || !accessToken) return
    const ws = new WebSocket(`${WS_BASE_URL}/ws/hunt/sessions/${sessionId}?token=${encodeURIComponent(accessToken)}`)
    wsRef.current = ws

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data) as WsEvent
        if (msg.type === 'message_created') {
          setMessages((prev) => [
            ...prev,
            {
              id: msg.payload.id,
              sender: msg.payload.sender as any,
              content_text: msg.payload.content_text,
              created_at: msg.payload.created_at,
            },
          ])
        }
        if (msg.type === 'entity_extracted') {
          const e = msg.payload.entity
          setEntities((prev) => {
            const key = `${e.entity_type}:${e.value_masked}`
            if (prev.some((p) => `${p.entity_type}:${p.value_masked}` === key)) return prev
            return [
              ...prev,
              {
                id: key,
                entity_type: e.entity_type,
                value_masked: e.value_masked,
                confidence: e.confidence,
                created_at: new Date().toISOString(),
              },
            ]
          })
        }
        if (msg.type === 'status_updated') {
          setSuspicion(msg.payload.suspicion_score ?? 0)
        }
      } catch {
        // ignore
      }
    }

    ws.onopen = () => {
      // keep-alive ping
      pingRef.current = window.setInterval(() => {
        try {
          ws.send('ping')
        } catch {
          // ignore
        }
      }, 20_000)
    }

    ws.onclose = () => {
      if (pingRef.current) window.clearInterval(pingRef.current)
      pingRef.current = null
    }

    return () => {
      if (pingRef.current) window.clearInterval(pingRef.current)
      pingRef.current = null
      ws.close()
      wsRef.current = null
    }
  }, [accessToken, sessionId])

  const bubble = (m: HuntMessage) => {
    if (m.sender === 'SCAMMER') return 'mr-auto bg-slate-100 text-slate-900'
    if (m.sender === 'AI') return 'ml-auto bg-indigo-600 text-white'
    return 'mx-auto bg-slate-50 text-slate-700'
  }

  const suspicionTone = suspicion >= 60 ? 'red' : suspicion >= 40 ? 'yellow' : 'gray'
  const extractedCount = entities.length

  const header = useMemo(() => {
    const s = sessionQuery.data
    if (!s) return null
    return (
      <Card className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">실시간 사냥 중계</div>
          <Badge tone={suspicionTone as any}>의심 {suspicion}%</Badge>
        </div>
        <div className="text-xs text-slate-500">
          페르소나: {s.persona_type ?? '—'} · 추출 {extractedCount}건
        </div>
        <div className="h-2 w-full rounded-full bg-slate-100">
          <div className="h-2 rounded-full bg-rose-500" style={{ width: `${Math.min(100, suspicion)}%` }} />
        </div>
      </Card>
    )
  }, [extractedCount, sessionQuery.data, suspicion, suspicionTone])

  return (
    <div className="space-y-3">
      <Link to="/app/hunt" className="text-sm font-semibold text-indigo-600">
        ← 세션 목록
      </Link>

      {header}

      <Card className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">대화</div>
          <Button variant="secondary" disabled={createReport.isPending} onClick={() => createReport.mutate()}>
            {createReport.isPending ? '생성 중…' : '신고 초안'}
          </Button>
        </div>
        <div className="max-h-[360px] space-y-2 overflow-auto rounded-2xl bg-slate-50 p-3">
          {messages.map((m) => (
            <div key={m.id} className={['max-w-[85%] rounded-2xl px-3 py-2 text-sm', bubble(m)].join(' ')}>
              <div className="whitespace-pre-wrap">{m.content_text}</div>
              <div className="mt-1 text-[10px] opacity-70">{new Date(m.created_at).toLocaleTimeString()}</div>
            </div>
          ))}
          {messages.length === 0 ? <div className="text-sm text-slate-500">아직 메시지가 없어요.</div> : null}
        </div>
      </Card>

      <Card className="space-y-2">
        <div className="text-sm font-semibold text-slate-900">추출 정보</div>
        <div className="space-y-2">
          {entities.map((e) => (
            <div key={`${e.entity_type}:${e.value_masked}`} className="flex items-center justify-between rounded-2xl border border-slate-200 px-3 py-2">
              <div className="min-w-0">
                <div className="text-xs text-slate-500">{e.entity_type}</div>
                <div className="truncate text-sm font-semibold text-slate-900">{e.value_masked}</div>
              </div>
              <Badge tone="gray">{Math.round(e.confidence * 100)}%</Badge>
            </div>
          ))}
          {entities.length === 0 ? <div className="text-sm text-slate-500">아직 추출된 정보가 없어요.</div> : null}
        </div>
      </Card>
    </div>
  )
}

