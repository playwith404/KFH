# 프론트엔드 상세명세서 (React + Vite)

프로젝트: **케이팝 피싱 헌터즈 (K-Phishing Hunterz)**  
문서 목적: PRD 기반으로 웹 프론트엔드(헌터 터미널 + 경찰/운영 콘솔)의 화면/흐름/컴포넌트/상태/연동 API를 구체화한다.

---

## 0) 전제/범위

### 0.1 타겟
- **웹 앱(반응형)** 1개로 헌터/경찰/운영자 UI를 제공한다.
- 푸시 알림은 **브라우저 Notification + 인앱 알림센터**를 기본으로 하며, 모바일 앱/푸시는 확장 범위로 둔다.
- 배포는 **Docker 컨테이너**로 수행하며, **프론트 외부 노출 포트는 `3700`**을 사용한다.
- 운영 도메인은 `kph.pjcloud.store`를 사용한다.
- 원 기획은 모바일 앱이지만, **데모 웹 버전은 모바일 앱과 유사한 단일 컬럼(모바일) 레이아웃**을 기본으로 구성한다(데스크톱에서도 모바일 프레임 형태로 렌더링).

### 0.2 MVP 범위(공모전/프로토타입 가정)
- 온보딩(교육/테스트/서약) 완료 → 헌터 자격 발급
- 미끼 템플릿 조회/복사/배포 기록
- “낚시 성공(유입)” 이벤트를 **시뮬레이션/수동 생성**으로도 재현 가능
- 실시간 대화(텍스트) 관전 + 상태바 + 정보 추출 하이라이트
- 신고 요청(2차 검증: 체크리스트) 제출
- 경찰(3차) 승인/반려 + 교차검증(2인 이상) 로직
- 포인트 적립/내역/등급/랭킹/보상(교환 신청) 기본
- 글로벌 뷰(지도/지표)는 **샘플 데이터 기반**으로 노출 가능

### 0.3 비범위(문서에는 인터페이스만 정의)
- 실제 통신사/금융결제원/경찰 DB 연계의 프로덕션 계약/운영
- 실제 음성 통화(STT/TTS) 실시간 처리(확장 기능)
- 실제 가상번호(Twilio/Vonage) 자동 발급(확장 기능)

---

## 1) 사용자/권한 모델 (RBAC)

| 역할 | 코드 | 가능 기능(요약) |
|---|---|---|
| 헌터 | `HUNTER_*` | 온보딩, 미끼 배포, 세션 관전, 신고 요청, 보상 교환 |
| 경찰(수사관) | `POLICE` | 신고 3차 승인/반려, 모니터링 대상 관리, 오탐 처리 |
| 운영자 | `ADMIN` | 사용자/등급/보상/미끼 템플릿 관리, 지표/콘텐츠 관리 |

권한은 백엔드에서 최종 강제하며, 프론트는 **가드 + UI 숨김**을 수행한다.

---

## 2) 기술 스택/구조(권장)

### 2.1 스택
- React 18 + Vite + TypeScript
- 라우팅: `react-router-dom`
- 서버상태: `@tanstack/react-query`
- 폼/검증: `react-hook-form` + `zod`
- HTTP: `axios`(또는 fetch) + 인터셉터(토큰/리프레시)
- 상태: 경량 전역(`zustand`) — 세션/알림/웹소켓 연결 정도
- UI: Tailwind + headless 컴포넌트(선호) 또는 MUI (프로젝트 선택)
- 환경변수(권장)
  - 개발: `VITE_API_BASE_URL=http://localhost:8700/api/v1`, `VITE_WS_BASE_URL=ws://localhost:8700`
  - 운영: `VITE_API_BASE_URL=https://kph.pjcloud.store/api/v1`, `VITE_WS_BASE_URL=wss://kph.pjcloud.store`

### 2.2 프로젝트 구조(예시)
```
src/
  app/ (라우터, QueryClient, providers)
  pages/
  features/ (onboarding, bait, hunt, reports, rewards, admin)
  components/ (공용 UI)
  api/ (client, endpoints, types)
  stores/ (auth, notifications, ws)
  utils/ (format, validators, rbac)
```

---

## 3) 정보구조(IA) / 라우팅

### 3.1 Public
- `/` 랜딩
- `/auth/login`
- `/auth/callback` (SSO/본인인증 콜백이 있을 경우)
- `/legal/terms`, `/legal/privacy`

### 3.2 Hunter
- `/onboarding` (스텝퍼)
  - `/onboarding/identity`
  - `/onboarding/training`
  - `/onboarding/test`
  - `/onboarding/oath`
  - `/onboarding/certificate`
- `/app` (메인)
  - `/app/dashboard`
  - `/app/baits`
  - `/app/baits/:baitId`
  - `/app/hunt` (세션 리스트)
  - `/app/hunt/:sessionId` (실시간 관전)
  - `/app/reports`
  - `/app/reports/:reportId`
  - `/app/rewards`
  - `/app/ranking`
  - `/app/global` (지도/지표)
  - `/app/profile`
  - `/app/notifications`

### 3.3 Police/Admin
- `/console` (권한 필요)
  - `/console/reports` (3차 승인 큐)
  - `/console/reports/:reportId`
  - `/console/monitoring` (단일 신고/모니터링 대상)
  - `/console/users` (ADMIN)
  - `/console/content` (교육/테스트/서약 문서 관리)
  - `/console/rewards` (보상 카탈로그/교환 요청 처리)
  - `/console/audit` (감사 로그 조회, ADMIN)

라우트 가드:
- 인증 필요: `RequireAuth`
- 역할 필요: `RequireRole(['POLICE','ADMIN'])`
- 온보딩 완료 필요: `RequireHunterVerified` (헌터 화면 대부분)

---

## 4) 공통 UI/UX 규칙

### 4.1 상태/피드백
- 모든 API 호출은 **로딩 스켈레톤/스피너** + 실패 토스트
- 작업 성공: 토스트 + “최근 활동”에 즉시 반영(Optimistic 또는 re-fetch)
- 네트워크 불안정: 상단 배너(“연결 상태 불안정”)

### 4.2 보안/개인정보
- 토큰은 JWT 기반으로, `access_token`은 API 호출 시 `Authorization: Bearer <token>`로 전송한다(저장 방식은 MVP는 단순화, 운영은 HttpOnly 쿠키/리프레시 토큰 등 보안 전략 적용 권장).
- 화면/로그에서 **실명/민감정보 최소 노출**, 필요 시 마스킹(예: 계좌 `110-***-****`)
- 역할 변경/권한 오류: 403 페이지 + 홈/로그아웃 액션 제공

### 4.3 접근성(A11y)
- 키보드 포커스 이동 가능(모달/드롭다운)
- 색상만으로 상태 전달 금지(“성공/경고/위험” 아이콘+텍스트)

---

## 5) 화면별 상세 명세

아래에서 “연동 API”는 `BACKEND_SPEC.md`의 엔드포인트 정의를 기준으로 한다.

### 5.1 랜딩 (`/`)
**목적:** 서비스 소개 + 가입/로그인 유도  
**구성:**
- 핵심 카피(“내가 피싱에게로 간다.”)
- 주요 기능(미끼/관전/검증/보상/데이터 오염) 요약
- CTA: 로그인, “헌터 지원하기”
**연동 API:** 없음(정적) 또는 공지/지표 요약(`GET /public/metrics`)

### 5.2 로그인 (`/auth/login`)
**목적:** 사용자 인증/세션 시작  
**기능:**
- 이메일/비밀번호 로그인(JWT)
- 로그인 성공 시 `access_token`(JWT)을 저장하고, 이후 API 호출에 `Authorization: Bearer <token>`을 첨부(만료 시 `POST /auth/refresh`로 재발급)
- “본인인증 시작” 버튼(온보딩 미완료 사용자용)
**연동 API:** `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
**에러:** 잠금/실패 횟수 초과, 비활성 계정, 역할 미부여

### 5.3 온보딩 스텝퍼 (`/onboarding/*`)
**목적:** 실명 인증 → 교육 이수 → 테스트 → 서약 → 자격 발급  
**공통 규칙:**
- 상단 진행률(5단계)
- 중간 이탈 시 “저장됨(autosave)” 안내
- 마지막 단계 완료 전까지 `/app/*` 접근 차단

#### 5.3.1 실명 인증 (`/onboarding/identity`)
**입력:** 이름/생년월일/휴대폰(또는 본인인증 provider 리다이렉트)  
**연동 API:** `POST /onboarding/identity/verify`, `GET /onboarding/status`
**데모 범위:** 본인인증 외부 연동 없이, 입력값 형식 검증 후(또는 데모 코드 입력 후) 서버에서 `provider=DEMO`로 인증 완료 처리한다.
**결과:** 성공 시 “공식 위촉 절차 진행” 안내

#### 5.3.2 온라인 교육 (`/onboarding/training`)
**구성:** 강의 목록(총 2시간), 챕터 진도, “수료 처리”  
**연동 API:** `GET /training/modules`, `POST /training/progress`, `POST /training/complete`
**규칙:** 총 시청 시간/퀴즈(선택) 기준 충족 시 수료 가능

#### 5.3.3 대응 테스트 (`/onboarding/test`)
**구성:** 10문항(객관식/상황형), 타이머(선택), 결과 리포트  
**연동 API:** `GET /tests/hunter-qualification`, `POST /tests/submit`
**규칙:** 80점 이상 통과, 재응시 제한(예: 24시간 3회)

#### 5.3.4 서약서 전자서명 (`/onboarding/oath`)
**구성:** 서약서 본문 + 체크박스(비밀유지/법적 범위 이해) + 서명 패드(마우스/터치)  
**연동 API:** `GET /oaths/current`, `POST /oaths/sign`

#### 5.3.5 임명/자격증 (`/onboarding/certificate`)
**구성:** 임명장 애니메이션(선택), 헌터 번호/가상 식별자, 디지털 카드(다운로드)  
**연동 API:** `GET /hunters/certificate`

---

### 5.4 대시보드 (`/app/dashboard`)
**목적:** 오늘의 활동/포인트/등급/진행 중 세션 요약  
**구성:**
- KPI: 오늘 배포 수, 접촉 유도 수, 정보 추출 수, 승인 수
- “진행 중 사냥” 카드(있으면 상단 고정)
- “최근 신고” 리스트
**연동 API:** `GET /me/summary`, `GET /hunt/sessions?status=active`, `GET /reports?mine=1`

---

### 5.5 미끼 목록 (`/app/baits`)
**목적:** 미끼 유형 선택/복사/배포 기록  
**구성:**
- 필터: 유형(A/B/C/D), 상태(배포 가능/쿨다운), 생성일
- 카드: 미끼 문구, 가상 번호/ID, “복사”, “배포 기록”
- 배포 모달: 플랫폼 선택(당근/번개/커뮤니티/SNS/기타) + URL(선택) + 메모
**연동 API:** `GET /baits`, `POST /baits/:baitId/deployments`, `GET /baits/:baitId/deployments`
**규칙:** 일 최대 5건, 동일 플랫폼 24시간 3건 이하(백엔드 정책값을 내려받아 UI에 반영)

### 5.6 미끼 상세 (`/app/baits/:baitId`)
**목적:** 미끼 내용/사용 이력/성과 확인  
**구성:** 미끼 원문, 가상 식별자, 배포 이력 타임라인, “오염 성공(유입) 횟수”
**연동 API:** `GET /baits/:baitId`, `GET /baits/:baitId/stats`

---

### 5.7 사냥 세션 목록 (`/app/hunt`)
**목적:** 유입(낚시 성공) 세션을 확인하고 관전 진입  
**구성:**
- 탭: 진행중 / 종료됨
- 리스트 항목: 세션 시작시간, 유입 경로(미끼), 사기 의심도, 추출된 정보 개수
- 알림 설정: “진행중 세션 발생 시 알림 받기”
**연동 API:** `GET /hunt/sessions`, `POST /notifications/preferences`

---

### 5.8 실시간 관전 (`/app/hunt/:sessionId`)
**목적:** AI 페르소나가 사기꾼과 대화하는 과정을 실시간 관전하고, 정보 추출/신고로 연결  
**레이아웃(권장):**
- 좌측: 사기꾼 메시지(또는 STT 텍스트)
- 우측: AI 응답 + 페르소나 라벨(“어리숙한 노인” 등)
- 상단: 상태바(사기 의심도 %, “계좌 유도 중” 단계)
- 우하단: 추출 패널(계좌/URL/전화/메신저ID) + “신고 요청”

**실시간 처리:**
- WebSocket 구독: 메시지 스트림, 상태 업데이트, 추출 이벤트
- 연결 끊김 시 자동 재연결(지수 백오프), 복구 시 누락 구간은 `GET /hunt/sessions/:id/messages?after=`로 보정

**연동 API:**
- `GET /hunt/sessions/:sessionId`
- `GET /hunt/sessions/:sessionId/messages`
- `WS /ws/hunt/sessions/:sessionId`
- `POST /reports` (세션 기반 신고 요청 생성)

---

### 5.9 신고 목록 (`/app/reports`)
**목적:** 내가 제출한 신고의 상태(모니터링/교차검증/승인/반려)를 추적  
**구성:**
- 상태 필터: Draft / 제출됨 / 교차검증 대기 / 경찰 검토 / 승인 / 반려 / 종결
- 리스트: 대상(계좌/URL), 생성일, 현재 단계, 최근 코멘트
**연동 API:** `GET /reports?mine=1`

### 5.10 신고 상세 + 2차 검증 (`/app/reports/:reportId`)
**목적:** 대화 전문 확인 + 체크리스트 8개 항목 + 근거 작성 후 제출  
**구성:**
- 대화 전문(읽기 전용) + 핵심 발화 하이라이트
- 추출 정보 카드(계좌/URL/전화/IP 등) + 신뢰도
- 체크리스트 8개(필수) + 자유서술 근거(필수)
- 제출 버튼(“신고 요청”)
**연동 API:**
- `GET /reports/:reportId`
- `POST /reports/:reportId/hunter-review` (2차 검증 제출)
- `GET /reports/:reportId/transcript`
**검증:** 8개 항목 체크 + 근거 최소 글자 수(예: 50자)

---

### 5.11 보상/포인트 (`/app/rewards`)
**목적:** 포인트 내역 확인 + 보상 교환 신청  
**구성:**
- 현재 포인트/등급/다음 등급까지 필요치
- 포인트 내역(필터: 적립/차감/보류)
- 보상 카탈로그(상품권/기프티콘/쿠폰) + 교환 신청
**연동 API:** `GET /points/ledger`, `GET /rewards/catalog`, `POST /rewards/redemptions`
**규칙:** 교환 신청은 경찰/운영 승인 흐름이 있을 수 있음(상태: 신청/처리중/완료/반려)

---

### 5.12 랭킹/명예의 전당 (`/app/ranking`)
**목적:** 참여 유도(주간/월간)  
**구성:** 탭(주간/월간/지역), 내 순위 고정, 상위 N명
**연동 API:** `GET /ranking?period=weekly`

---

### 5.13 데이터 오염 현황(글로벌 뷰) (`/app/global`)
**목적:** 전체 지표 + 지도 시각화  
**구성:**
- 지표 카드: 오염도(%), 범죄 수익성 변화(%), 금일 활동량
- 지도: IP 기반 도트(클러스터링), 지역 히트맵(선택)
**연동 API:** `GET /analytics/global`, `GET /analytics/map-dots`
**비고:** 지도 엔진은 교체 가능하도록 `MapAdapter` 인터페이스로 감싼다.

---

### 5.14 프로필/설정 (`/app/profile`)
**목적:** 내 등급/자격/활동/알림/보안 설정  
**구성:**
- 헌터 자격 카드, 등급/정확도, 활동 통계
- 알림 설정(세션/승인/반려/보상)
- 계정 보안(로그아웃, 기기 세션)
**연동 API:** `GET /me`, `PATCH /me/preferences`, `GET /auth/sessions`, `DELETE /auth/sessions/:id`

---

### 5.15 알림센터 (`/app/notifications`)
**구성:** 읽지 않음/전체 탭, 타입 필터(세션/신고/보상)  
**연동 API:** `GET /notifications`, `POST /notifications/:id/read`

---

## 6) 콘솔(경찰/운영자) 상세

### 6.1 신고 승인 큐 (`/console/reports`)
**목적:** 3차 검증(경찰) 처리  
**구성:**
- 필터: “교차검증 충족”, “단일 신고(모니터링)”, “긴급”
- 리스트: 대상(계좌/URL), 신고자 수, AI 1차 점수, 헌터 체크리스트 요약
**연동 API:** `GET /console/reports?status=awaiting_police`

### 6.2 신고 상세/승인 (`/console/reports/:reportId`)
**구성:**
- 증거 묶음(대화 전문/추출 정보/AI 지표/헌터 근거)
- 액션: 승인/반려/추가정보요청/모니터링 전환
- 코멘트(내부/헌터에게 공개)
**연동 API:** `POST /console/reports/:id/decision`

### 6.3 운영 관리(ADMIN)
- 사용자/등급: `GET /console/users`, `PATCH /console/users/:id`
- 교육/테스트/서약 문서: `GET/PUT /console/content/*`
- 보상 카탈로그/교환 요청 처리: `GET/POST /console/rewards/*`
- 감사 로그: `GET /console/audit`

---

## 7) 공통 컴포넌트/모듈 명세(요약)

- `AppShell`: 상단바(포인트/알림), 좌측 내비, 콘텐츠 영역
- `RoleGuard`: RBAC 라우트/컴포넌트 가드
- `DataTable`: 서버 페이지네이션/정렬/필터 공통
- `EvidenceViewer`: 대화 전문/추출 정보/하이라이트 렌더러
- `ChecklistForm`: 8개 체크 + 근거 텍스트 + 제출
- `SessionStream`: WS 메시지 렌더, 재연결, 스크롤 고정/검색
- `MapView`: 도트/히트맵, 클러스터링, 범례

---

## 8) 프론트엔드 에러/상태 코드 매핑(권장)

| HTTP | 화면 처리 |
|---|---|
| 400 | 폼 필드 에러 표시 + 토스트 |
| 401 | 로그인 페이지로 이동(세션 만료 안내) |
| 403 | “권한 없음” 페이지 + 문의 안내 |
| 404 | “존재하지 않음” 페이지 |
| 409 | 중복/경합(예: 이미 처리된 신고) → 최신 상태 재로딩 |
| 429 | “요청이 많습니다” 안내 + 잠시 후 재시도 |
| 500 | 장애 안내 + 재시도 버튼 |

---

## 9) 릴리즈 단위(권장)

1) Auth + 온보딩(교육/테스트/서약) + 자격증  
2) 미끼(복사/배포 기록) + 포인트 기본  
3) 세션 관전(WS) + 추출/신고 Draft 생성  
4) 신고(2차) + 콘솔(3차) + 교차검증  
5) 보상/랭킹/글로벌 뷰(지표/지도)

---

## 10) 배포/포트(운영 전제)

- 프론트엔드는 Docker로 배포하며 **외부 노출 포트는 `3700`**을 사용한다.
- 백엔드는 Docker로 배포하며 **외부 노출 포트는 `8700`**을 사용한다.
- 운영 도메인은 `kph.pjcloud.store`를 사용한다.
- 권장(운영): 리버스 프록시에서 `kph.pjcloud.store`(80/443) → 프론트(3700), `/api/*`와 `/ws/*` → 백엔드(8700)로 라우팅한다.
- 프론트 환경변수(운영 예시)
  - `VITE_API_BASE_URL=https://kph.pjcloud.store/api/v1`
  - `VITE_WS_BASE_URL=wss://kph.pjcloud.store`
