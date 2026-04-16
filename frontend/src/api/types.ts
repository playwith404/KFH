import type { UserRole, UserStatus } from '../stores/auth'

export type MeResponse = {
  id: string
  email: string
  role: UserRole
  status: UserStatus
}

export type OnboardingStatus = {
  identity_verified: boolean
  training_completed: boolean
  test_passed: boolean
  oath_signed: boolean
  hunter_verified: boolean
  hunter_level: string | null
}

export type TrainingModule = {
  id: string
  title: string
  duration_seconds: number
  watched_seconds: number
  completed_at: string | null
}

export type TestQuestion = {
  id: string
  question_text: string
  options: string[]
}

export type TestOut = {
  id: string
  code: string
  title: string
  questions: TestQuestion[]
}

export type Bait = {
  id: string
  template_id: string
  virtual_phone: string | null
  virtual_messenger_id: string | null
  rendered_body: string
  created_at: string
}

export type BaitDeployment = {
  id: string
  bait_id: string
  platform: string
  post_url: string | null
  memo: string | null
  deployed_at: string
}

export type HuntSession = {
  id: string
  bait_id: string
  status: string
  persona_type: string | null
  suspicion_score: number
  started_at: string
  ended_at: string | null
}

export type HuntMessage = {
  id: string
  sender: 'SCAMMER' | 'AI' | 'SYSTEM'
  content_text: string
  created_at: string
}

export type ExtractedEntity = {
  id: string
  entity_type: string
  value_masked: string
  confidence: number
  created_at: string
}

export type HuntSessionDetail = HuntSession & {
  extracted_entities: ExtractedEntity[]
}

export type Report = {
  id: string
  session_id: string
  status: string
  stage1_indicator_hits: number
  stage1_pass: boolean
  primary_evidence_key: string | null
  monitoring_until: string | null
  created_at: string
  updated_at: string
}

export type ReportDetail = Report & {
  hunter_review: {
    checklist: Record<string, boolean>
    rationale_text: string
    submitted_at: string
  } | null
  police_decision:
    | {
        decision: string
        comment_public: string | null
        comment_internal: string | null
        decided_at: string
      }
    | null
}

export type PointsLedgerEntry = {
  id: string
  delta: number
  reason_code: string
  reference_type: string
  reference_id: string
  created_at: string
}

export type PointsLedgerResponse = {
  balance: number
  entries: PointsLedgerEntry[]
}

export type RewardItem = {
  id: string
  title: string
  cost_points: number
  is_active: boolean
}

