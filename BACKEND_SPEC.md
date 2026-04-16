# 백엔드 상세명세서 (FastAPI)

프로젝트: **케이팝 피싱 헌터즈 (K-Phishing Hunterz)**  
문서 목적: PRD 기반으로 API/데이터모델/비즈니스룰/실시간/권한/운영 콘솔 요구사항을 구체화한다.

---

## 0) 전제/범위

- 백엔드는 **FastAPI + PostgreSQL + Redis**를 기본으로 한다.
- PostgreSQL은 **서버에 이미 설치되어 있으며**, 본 프로젝트는 **신규 DB/계정/스키마를 추가**하는 방식으로 사용한다(별도 Postgres 컨테이너는 두지 않음).
- 배포는 **Docker 컨테이너**로 수행하며, **백엔드 외부 노출 포트는 `8700`**을 사용한다.
- 운영 도메인은 `kph.pjcloud.store`를 사용한다.
- 실시간 관전/알림은 **WebSocket**을 1차 채널로 제공한다.
- 외부 연계(가상번호/금융/경찰 DB/STT/TTS/Canary Token)는 **인터페이스만 정의**하고 MVP에서는 Stub/시뮬레이터로 대체 가능.

---

## 1) 시스템 구성(권장)

### 1.1 런타임/프레임워크
- Python 3.11+
- FastAPI
- Pydantic v2 (요청/응답 스키마)
- ORM: SQLAlchemy 2.0 + Alembic 마이그레이션(권장)
- Redis: 캐시/레이트리밋/웹소켓 브로드캐스트(필요 시)

### 1.2 비동기/잡(확장)
- 백그라운드 작업(택1)
  - FastAPI BackgroundTasks (MVP)
  - Celery/RQ + Redis (확장: 보상 정산, 데이터 파기, 지표 집계)

### 1.3 API 베이스 경로
- 권장: `/api/v1`
- 본 문서의 경로 표기는 **베이스 경로를 제외한 상대 경로**로 작성한다.

### 1.4 실행/환경변수(권장)
- 서버 바인딩: `0.0.0.0:8700`
- 필수(권장)
  - `APP_PORT=8700`
  - `DATABASE_URL=postgresql+psycopg://<user>:<pass>@<db_host>:5432/khp`
  - `JWT_SECRET=CHANGE_ME`
- 권장
  - `CORS_ALLOW_ORIGINS=http://localhost:3700,https://kph.pjcloud.store`
  - `REDIS_URL=redis://<redis_host>:6379/0` (사용 시)
  - `ACCESS_TOKEN_EXPIRES_MINUTES=15`, `REFRESH_TOKEN_EXPIRES_DAYS=14`
  - `DEMO_IDENTITY_VERIFICATION=true` (데모용 실명인증)
  - `DEMO_IDENTITY_CODE=000000` (데모 코드, 사용 시)

### 1.5 PostgreSQL DB 추가(운영 전제)
- DB는 서버에 기설치되어 있으므로, 아래 작업만 수행한다.
  - 애플리케이션용 DB 사용자(ROLE) 생성
  - 프로젝트 DB 생성 및 소유자/권한 부여
  - 마이그레이션(Alembic)으로 테이블 생성

예시(SQL):
```sql
CREATE ROLE khp_app LOGIN PASSWORD 'CHANGE_ME';
CREATE DATABASE khp OWNER khp_app;
GRANT ALL PRIVILEGES ON DATABASE khp TO khp_app;
```

주의(도커 네트워크):
- 백엔드가 Docker로 동작할 때 DB가 “같은 서버의 localhost”에 있어도, 컨테이너에서 `localhost`는 DB를 가리키지 않는다.
- `DATABASE_URL`의 `<db_host>`는 환경에 맞게 **호스트 IP/도메인** 또는(가능한 경우) `host.docker.internal`을 사용한다.

Redis(도커, 외부 포트 `10700` 사용):
- Redis 컨테이너 내부 포트는 기본 `6379`이며, 호스트에 `10700:6379` 형태로 매핑한다.
- 백엔드 컨테이너가 Redis에 접근하는 방식은 운영 구성에 따라 둘 중 하나로 정한다.
  - (권장) 동일 Docker 네트워크에 붙이고 `REDIS_URL=redis://<redis_container_name>:6379/0`
  - 호스트 포트로 접근 시 `REDIS_URL=redis://host.docker.internal:10700/0` 또는 호스트 IP 사용

---

## 2) 역할/권한(RBAC)

### 2.1 역할
- `HUNTER` (등급은 별도 필드: `TRAINEE/ROOKIE/REGULAR/ELITE/MASTER`)
- `POLICE`
- `ADMIN`

### 2.2 접근 제어 원칙
- 모든 엔드포인트는 서버에서 RBAC 강제
- 데이터 스코프:
  - 헌터: 본인 데이터 + 본인 제출/관전 세션 범위
  - 경찰: 신고/모니터링 전체, PII는 최소
  - 운영자: 콘텐츠/보상/사용자/감사 전체

---

## 3) 핵심 도메인/비즈니스 룰

### 3.1 온보딩 완료 조건(PRD SCENE 1)
아래를 모두 만족하면 `hunter_verified=true`:
1) 실명 인증 성공
2) 온라인 교육 수료(총 2시간 기준 또는 정책값)
3) 테스트 10문항 80점 이상
4) 서약서 전자서명 완료

### 3.2 미끼 배포 제한(PRD 5.3)
- 1인 1일 배포 최대: 기본 `5` (정책 테이블로 조정)
- 동일 플랫폼 24시간 내 최대: 기본 `3`
- 배포 시 포인트 적립: `+10P` (일 최대 5건까지만)

### 3.3 3단계 검증(PRD 4.1)
상태 머신(권장):
- `DRAFT`(신고 초안)  
- `SUBMITTED_BY_HUNTER`(2차 검증 제출됨)
- `MONITORING`(단일 신고/교차검증 대기, 30일)
- `AWAITING_POLICE`(교차검증 충족, 3차 대기)
- `APPROVED`(최종 승인)
- `REJECTED`(반려)
- `CLOSED_NO_CONFIRM`(30일 내 추가 신고 없음)

### 3.4 AI 1차 판정(5대 지표)
- 지표 5개(선입금/안전결제 사칭/타 플랫폼 이동/시간 압박/신원 회피)
- 산출:
  - `indicator_hits`: 0~5
  - `stage1_pass`: `indicator_hits >= 3`
- `stage1_pass=false`여도 헌터가 2차 제출은 가능하되, 경찰 큐로 올리기 전 **교차검증 + 최소 증거 요건**을 추가로 요구할 수 있음(정책값).

### 3.5 교차검증(2인 이상)
- 키 개념: `evidence_key` (예: 계좌번호/전화번호/URL 정규화 값)
- 동일 `evidence_key`에 대해 **서로 다른 헌터 2명 이상**이 `SUBMITTED_BY_HUNTER`를 제출하면:
  - 해당 신고들을 `AWAITING_POLICE`로 승격(또는 “그룹” 단위 처리)
- 단일 신고는 `MONITORING`으로 전환하고 `monitoring_until = now + 30 days`
- 30일 내 추가 신고 없으면 `CLOSED_NO_CONFIRM`

### 3.6 오탐(허위) 처리
- 경찰이 `REJECTED_FALSE_POSITIVE`로 판정하면:
  - 관련 엔티티/세션/신고 증거의 **즉시 파기(정책)** 또는 익명 통계만 유지
  - 해당 헌터 오탐 카운트 증가(등급 강등/제명 룰 적용)

### 3.7 포인트/보상(PRD 9)
- 포인트는 반드시 **원장(ledger) 기반**으로 누적(절대 값 저장 최소화)
- 이벤트는 **멱등(idempotent)** 해야 함(중복 적립 방지)
  - `reference_type + reference_id + reason_code` 유니크 권장

---

## 4) 데이터 모델(테이블 설계 초안)

> 실제 구현 시 컬럼명/타입은 팀 컨벤션에 맞춰 조정. `id`는 UUID 권장.

### 4.1 사용자/인증
- `users`
  - `id`, `email`, `password_hash`, `role`(HUNTER/POLICE/ADMIN), `status`(ACTIVE/SUSPENDED/DELETED), `created_at`
- `auth_sessions`
  - `id`, `user_id`, `refresh_token_hash`(옵션), `ip`, `user_agent`, `created_at`, `expires_at`, `revoked_at`

### 4.2 헌터 프로필/온보딩
- `hunter_profiles`
  - `user_id(PK/FK)`, `hunter_number`(고유), `level`(TRAINEE…MASTER), `verified_at`, `accuracy_score`(0~100), `is_dormant`, `last_active_at`
- `identity_verifications`
  - `id`, `user_id`, `provider`, `provider_tx_id`, `status`, `verified_at`
- `training_modules`, `training_progress`
  - 모듈: `id`, `title`, `duration_seconds`, `is_active`
  - 진도: `user_id`, `module_id`, `watched_seconds`, `completed_at`
- `tests`, `test_questions`, `test_attempts`
  - 시도: `id`, `user_id`, `test_id`, `score`, `passed`, `submitted_at`
- `oath_documents`, `oath_signatures`
  - 서약: `doc_id`, `version`, `content_md`, `published_at`
  - 서명: `id`, `user_id`, `doc_id`, `signed_at`, `signature_blob`(이미지/벡터), `ip`

### 4.3 미끼/배포
- `bait_templates`
  - `id`, `type`(A/B/C/D), `title`, `body_template`, `is_active`
- `baits`
  - `id`, `template_id`, `issued_to_user_id`(옵션), `virtual_phone`, `virtual_messenger_id`, `rendered_body`, `created_at`, `expires_at`
- `bait_deployments`
  - `id`, `bait_id`, `user_id`, `platform`(DAANGN/BUNJANG/CAFE/SNS/ETC), `post_url`(옵션), `memo`, `deployed_at`

### 4.4 사냥(세션/대화/추출)
- `hunt_sessions`
  - `id`, `bait_id`, `status`(ACTIVE/ENDED), `persona_type`, `suspicion_score`(0~100), `started_at`, `ended_at`
  - `scammer_contact`(전화/ID 마스킹 저장), `scammer_ip`(옵션), `scammer_user_agent`(옵션)
- `hunt_messages`
  - `id`, `session_id`, `sender`(SCAMMER/AI/SYSTEM), `content_text`, `created_at`
- `extracted_entities`
  - `id`, `session_id`, `entity_type`(BANK_ACCOUNT/PHONE/URL/IP/MESSENGER_ID), `value_normalized`, `value_masked`, `confidence`, `evidence_message_id`, `created_at`

### 4.5 신고/검증/결정
- `reports`
  - `id`, `session_id`, `created_by_user_id`, `status`, `stage1_indicator_hits`, `stage1_pass`, `primary_evidence_key`(옵션), `monitoring_until`, `created_at`, `updated_at`
- `report_hunter_reviews`
  - `report_id(PK/FK)`, `check_1..check_8`(bool), `rationale_text`, `submitted_at`
- `report_police_decisions`
  - `report_id(PK/FK)`, `officer_user_id`, `decision`(APPROVE/REJECT/MONITOR/REQUEST_MORE), `comment_public`, `comment_internal`, `decided_at`
- `evidence_occurrences` (교차검증 인덱스)
  - `evidence_key`, `report_id`, `hunter_user_id`, `submitted_at`
  - 유니크: (`evidence_key`, `hunter_user_id`) — 동일 헌터 중복 카운트 방지

### 4.6 포인트/보상
- `point_ledger`
  - `id`, `user_id`, `delta`, `reason_code`, `reference_type`, `reference_id`, `created_at`
- `rewards_catalog`
  - `id`, `title`, `cost_points`, `is_active`, `inventory`(옵션)
- `reward_redemptions`
  - `id`, `user_id`, `reward_id`, `status`(REQUESTED/APPROVED/FULFILLED/REJECTED), `requested_at`, `processed_at`, `note`

### 4.7 알림/감사/지표
- `notifications`
  - `id`, `user_id`, `type`, `title`, `body`, `data_json`, `read_at`, `created_at`
- `audit_logs`
  - `id`, `actor_user_id`, `action`, `resource_type`, `resource_id`, `ip`, `user_agent`, `created_at`, `details_json`
- 지표는 뷰/테이블(집계)로 분리 가능:
  - `daily_metrics`, `regional_metrics`, `pollution_metrics`

---

## 5) API 상세(요약)

### 5.1 공통 규칙
- 요청/응답은 JSON
- 날짜는 ISO-8601(UTC) 권장
- 페이지네이션: `page`, `page_size` 또는 cursor(선택)
- 에러 포맷(권장):
```json
{
  "error": {
    "code": "RBAC_FORBIDDEN",
    "message": "권한이 없습니다.",
    "details": {}
  }
}
```

### 5.2 Auth
- 인증은 **이메일/비밀번호 + JWT(access token)** 방식으로 한다.
- 공통 헤더(인증 필요 API):
  - `Authorization: Bearer <access_token>`
- 토큰 정책(권장):
  - Access token: 15분(짧게)
  - Refresh token: 14일(길게), `auth_sessions`에 해시 저장하여 로그아웃/세션 폐기 가능

- `POST /auth/login`
  - req: `{ "email": "...", "password": "..." }`
  - res:
    - `{ "access_token": "...", "expires_in": 900, "refresh_token": "...", "me": {...} }`
- `POST /auth/logout`
  - req: `{ "refresh_token": "..." }` (해당 세션 폐기)
- `POST /auth/refresh`
  - req: `{ "refresh_token": "..." }`
  - res: `{ "access_token": "...", "expires_in": 900 }` (필요 시 refresh rotation 포함)
- `GET /auth/me`
- `GET /auth/sessions`
- `DELETE /auth/sessions/{session_id}`

### 5.3 Onboarding
- `GET /onboarding/status`
  - res: `{ identity_verified, training_completed, test_passed, oath_signed, hunter_verified, hunter_level }`
- `POST /onboarding/identity/verify`
  - 데모(`DEMO_IDENTITY_VERIFICATION=true`) req 예:
    - `{ "name": "...", "birthdate": "YYYY-MM-DD", "phone": "...", "demo_code": "000000" }`
  - res: `{ "verified": true, "provider": "DEMO", "verified_at": "..." }`
- `GET /training/modules`
- `POST /training/progress`
- `POST /training/complete`
- `GET /tests/hunter-qualification`
- `POST /tests/submit`
- `GET /oaths/current`
- `POST /oaths/sign`
- `GET /hunters/certificate`

### 5.4 Baits
- `GET /baits` (헌터용: 발급/사용 가능한 미끼 리스트)
- `GET /baits/{bait_id}`
- `POST /baits/{bait_id}/deployments`
  - req: `{ platform, post_url?, memo? }`
  - side-effect: 배포 제한 체크 + 포인트 적립(멱등키 권장)
- `GET /baits/{bait_id}/deployments`
- `GET /baits/{bait_id}/stats` (오염 성공 횟수 등)

### 5.5 Hunt (세션/실시간)
- `GET /hunt/sessions?status=active|ended`
- `GET /hunt/sessions/{session_id}`
- `GET /hunt/sessions/{session_id}/messages?after={message_id|timestamp}`
- `WS /ws/hunt/sessions/{session_id}`
  - 이벤트 타입(예시)
    - `message_created`
    - `status_updated` (의심도/단계)
    - `entity_extracted`
    - `session_ended`

MVP/시뮬레이션(운영/데모용, ADMIN만):
- `POST /console/hunt/sessions/simulate`
- `POST /console/hunt/sessions/{session_id}/messages`

### 5.6 Reports (헌터)
- `POST /reports`
  - req: `{ session_id }`
  - res: draft report
- `GET /reports?mine=1&status=...`
- `GET /reports/{report_id}`
- `GET /reports/{report_id}/transcript`
- `POST /reports/{report_id}/hunter-review`
  - req: `{ checklist: {c1..c8}, rationale_text }`
  - side-effect: `SUBMITTED_BY_HUNTER` 전환 + `evidence_key` 생성/등록 + 교차검증 평가

### 5.7 Console (경찰/운영)
- `GET /console/reports?status=awaiting_police|monitoring|...`
- `GET /console/reports/{report_id}`
- `POST /console/reports/{report_id}/decision`
  - req: `{ decision, comment_public?, comment_internal? }`
  - side-effect:
    - APPROVE → `APPROVED` + 포인트 적립(+300P 등)
    - REJECT → `REJECTED`(오탐이면 즉시 파기 정책 실행)
    - MONITOR → `MONITORING` 기간 부여/연장
- `GET /console/monitoring` (모니터링 대상 리스트)

ADMIN:
- `GET /console/users`, `PATCH /console/users/{user_id}`
- `GET/PUT /console/content/training`
- `GET/PUT /console/content/tests`
- `GET/PUT /console/content/oaths`
- `GET/POST/PATCH /console/rewards/catalog`
- `GET /console/rewards/redemptions`
- `POST /console/rewards/redemptions/{id}/decision`
- `GET /console/audit`

### 5.8 Points/Rewards (헌터)
- `GET /points/ledger`
- `GET /rewards/catalog`
- `POST /rewards/redemptions`
- `GET /rewards/redemptions?mine=1`

### 5.9 Ranking/Analytics/Notifications
- `GET /ranking?period=weekly|monthly&region=...`
- `GET /analytics/global`
- `GET /analytics/map-dots`
- `GET /notifications`
- `POST /notifications/{notification_id}/read`
- `POST /notifications/preferences`
- (옵션) `WS /ws/notifications`

---

## 6) WebSocket 이벤트 스키마(권장)

```json
{
  "type": "entity_extracted",
  "ts": "2026-02-10T12:34:56Z",
  "payload": {
    "session_id": "uuid",
    "entity": {
      "entity_type": "BANK_ACCOUNT",
      "value_masked": "110-***-****",
      "confidence": 0.92
    }
  }
}
```

---

## 7) 외부 연계 인터페이스(Stub 우선)

### 7.1 가상번호/메신저 ID
- 인터페이스: `VirtualIdentifierProvider`
  - `issue_phone_number(user_id) -> phone`
  - `issue_messenger_id(user_id) -> id`

### 7.2 STT/TTS
- 인터페이스: `SpeechService`
  - `stt(audio) -> text, confidence`
  - `tts(text, persona) -> audio`

### 7.3 Canary/추적
- 인터페이스: `TrackingService`
  - `generate_link(session_id) -> url`
  - `resolve_hit(token) -> ip, ua, geo`

### 7.4 기관 전송(금융/수사 DB)
- 인터페이스: `AgencyReportSink`
  - `submit_approved_report(report_id) -> receipt_id`
  - MVP에서는 “전송됨” 상태만 기록

---

## 8) 보안/감사/데이터 거버넌스

### 8.1 최소 수집/마스킹
- 헌터 실명/민감정보는 별도 저장(암호화/접근 제한), 기본 화면/API에서는 마스킹 값만 제공

### 8.2 접근 로그
- `POLICE/ADMIN`의 열람/처리 행동은 `audit_logs`에 필수 기록

### 8.3 보관/파기(PRD 11.2 반영)
- 오탐 데이터: 즉시 삭제(정책)
- 수사 종결 데이터: 3년 후 완전 삭제
- 헌터 활동 로그: 5년, 비식별화 후 통계 보관 가능
- 파기/익명화는 정기 잡으로 수행

---

## 9) 운영/품질(권장)

- 레이트리밋: 로그인/본인인증/테스트 제출 등에 적용(429)
- 관측성: 요청 로그 + 트레이스 ID + 주요 이벤트(승인/반려/파기) 구조화 로그
- 헬스체크: `/healthz`, `/readyz`
- OpenAPI: FastAPI 기본 스펙을 **운영 콘솔/프론트 연동의 계약**으로 사용
