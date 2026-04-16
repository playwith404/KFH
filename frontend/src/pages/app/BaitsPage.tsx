import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { api } from '../../api/client'
import type { Bait, BaitDeployment } from '../../api/types'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'

const platforms = [
  { value: 'DAANGN', label: '당근마켓' },
  { value: 'BUNJANG', label: '번개장터' },
  { value: 'CAFE', label: '네이버카페/커뮤니티' },
  { value: 'SNS', label: 'SNS' },
  { value: 'ETC', label: '기타' },
]

export function BaitsPage() {
  const baitsQuery = useQuery({
    queryKey: ['baits'],
    queryFn: async () => {
      const res = await api.get<Bait[]>('/baits')
      return res.data
    },
  })

  const [deployOpen, setDeployOpen] = useState(false)
  const [selectedBait, setSelectedBait] = useState<Bait | null>(null)
  const [platform, setPlatform] = useState('DAANGN')
  const [postUrl, setPostUrl] = useState('')
  const [memo, setMemo] = useState('')
  const [error, setError] = useState<string | null>(null)

  const createDeployment = useMutation({
    mutationFn: async () => {
      if (!selectedBait) throw new Error('No bait')
      const res = await api.post<BaitDeployment>(`/baits/${selectedBait.id}/deployments`, {
        platform,
        post_url: postUrl || null,
        memo: memo || null,
      })
      return res.data
    },
    onSuccess: async () => {
      setDeployOpen(false)
      setSelectedBait(null)
      setPostUrl('')
      setMemo('')
      setError(null)
    },
    onError: (err: any) => setError(err?.response?.data?.detail || '배포 기록에 실패했어요.'),
  })

  const baits = baitsQuery.data ?? []

  const helper = useMemo(() => {
    if (!baits.length) return null
    const phoneCount = baits.filter((b) => Boolean(b.virtual_phone)).length
    return `발급된 미끼 ${baits.length}개 · 가상번호 ${phoneCount}개`
  }, [baits])

  return (
    <div className="space-y-3">
      <Card className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">미끼 리스트</div>
          <Badge tone="indigo">+10P/배포</Badge>
        </div>
        <div className="text-xs text-slate-500">{helper ?? '미끼를 불러오는 중…'}</div>
      </Card>

      {baitsQuery.isError ? <div className="text-sm text-rose-600">미끼를 불러오지 못했어요.</div> : null}

      <div className="space-y-2">
        {baits.map((b) => (
          <div key={b.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900">미끼</div>
                <div className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{b.rendered_body}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {b.virtual_phone ? <Badge>{b.virtual_phone}</Badge> : null}
                  {b.virtual_messenger_id ? <Badge>{b.virtual_messenger_id}</Badge> : null}
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button
                variant="ghost"
                onClick={async () => {
                  await navigator.clipboard.writeText(b.rendered_body)
                }}
              >
                복사
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedBait(b)
                  setDeployOpen(true)
                }}
              >
                배포 기록
              </Button>
            </div>
            <div className="mt-2 text-center text-xs text-slate-500">
              <Link to={`/app/baits/${b.id}`} className="font-semibold text-indigo-600">
                상세 보기 →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {deployOpen && selectedBait ? (
        <div className="fixed inset-0 z-50 bg-black/40 p-4">
          <div className="mx-auto mt-10 max-w-[420px] rounded-3xl bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">배포 기록</div>
            <div className="mt-2 space-y-3">
              <Select label="플랫폼" value={platform} onChange={(e) => setPlatform(e.target.value)}>
                {platforms.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </Select>
              <Input label="게시글 URL (선택)" value={postUrl} onChange={(e) => setPostUrl(e.target.value)} />
              <Textarea label="메모 (선택)" value={memo} onChange={(e) => setMemo(e.target.value)} rows={3} />
              {error ? <div className="text-sm font-medium text-rose-600">{error}</div> : null}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="ghost" onClick={() => setDeployOpen(false)}>
                  취소
                </Button>
                <Button disabled={createDeployment.isPending} onClick={() => createDeployment.mutate()}>
                  {createDeployment.isPending ? '저장 중…' : '저장'}
                </Button>
              </div>
              <div className="text-xs text-slate-500">
                정책: 일 최대 5건, 동일 플랫폼 24시간 3건 이하(데모 기준)
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

