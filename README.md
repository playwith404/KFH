# K-Phishing Hunterz Web Demo

경찰청 사이버범죄 예방 공모전 제출용 PRD를 바탕으로 구현한 웹 데모입니다.  
원 기획은 모바일 앱이지만, 현재 구현은 모바일 앱처럼 보이고 동작하는 웹 데모에 맞춰 구성되어 있습니다.

> 실전처럼 연습하고, 안전하게 대응하자.

## 프로젝트 개요

K-Phishing Hunterz는 보이스피싱·스캠 대응을 위한 시민 참여형 데모 플랫폼입니다.
사용자는 헌터 온보딩을 거쳐 미끼 정보를 배포하고, 유입된 사기 시나리오를 관전하거나 검토하고,
수집된 정보를 신고·검증·보상 흐름으로 이어갈 수 있습니다.

현재 저장소에는 다음 범위가 구현되어 있습니다.

- 헌터 온보딩: 실명인증(데모), 교육, 테스트, 서약, 자격증 발급
- 헌터 기능: 미끼 목록, 미끼 상세, 사냥 세션, 신고, 포인트/보상, 랭킹, 알림
- 콘솔 기능: 신고 승인 큐, 모니터링, 사용자 관리, 보상 처리, 시뮬레이터, 콘텐츠 관리, 감사 로그
- 실시간 기능: WebSocket 기반 사냥 세션 중계
- 배포 구성: Docker 기반 프론트/백엔드, PostgreSQL, Redis, 리버스 프록시 연동

## 기술 스택

- Frontend: React 19, Vite, React Router, TanStack Query, Zustand, Tailwind CSS
- Backend: FastAPI, SQLAlchemy, Alembic, Uvicorn
- Database: PostgreSQL 16
- Realtime / Cache: Redis 7
- Infra: Docker Compose, Nginx, Let's Encrypt

## Team

- `Krminsung` - https://github.com/Krminsung
- `527NotFound` - https://github.com/527NotFound
- `18choyeonwoo` - https://github.com/18choyeonwoo
- `juin925` - https://github.com/juin925
- `nannanyeee` - https://github.com/nannanyeee

## 문서 구성

- 기획서: `PRD.md`
- 프론트 상세 명세: `FRONTEND_SPEC.md`
- 백엔드 상세 명세: `BACKEND_SPEC.md`

## 디렉토리 구조

- `frontend`: React + Vite 클라이언트
- `backend`: FastAPI 서버
- `deploy`: 배포용 참고 설정
- `docker-compose.demo.yml`: 데모 실행용 Compose
- `docker-compose.prod.yml`: 운영 예시 Compose

## 빠른 이해

### 사용자 흐름

1. 회원가입 또는 로그인
2. 실명인증(데모) -> 교육 이수 -> 테스트 통과 -> 서약
3. 자격증 발급 후 헌터 화면 진입
4. 미끼 배포 / 사냥 세션 확인 / 신고 제출
5. 관리자 또는 경찰 역할에서 검토 및 승인 처리

### 데모 계정

- Hunter: `hunter@kph.pjcloud.store` / `hunter1234`
- Police: `police@kph.pjcloud.store` / `police1234`
- Admin: `admin@kph.pjcloud.store` / `admin1234`

### 데모 본인인증 코드

- `000000`

## 실행 방식

### 1. 현재 서버형 데모 구성

이 저장소의 Compose 파일은 브라우저에 직접 포트를 여는 방식이 아니라,  
별도 리버스 프록시가 붙는 서버형 구성을 기준으로 작성되어 있습니다.

핵심 전제는 다음과 같습니다.

- 프론트/백엔드 컨테이너는 `ports`가 아니라 `expose`만 사용합니다.
- 외부 접속은 리버스 프록시가 처리합니다.
- 앱 컨테이너와 프록시 컨테이너가 같은 Docker 네트워크에 있어야 합니다.
- 외부 네트워크 이름은 `khp-net`입니다.

먼저 네트워크를 준비합니다.

```bash
docker network create khp-net
```

그 다음 데모 스택을 올립니다.

```bash
docker-compose -f docker-compose.demo.yml up -d --build
```

이 구성에서 내부 서비스 포트는 다음과 같습니다.

- Frontend container: `3700`
- Backend container: `8700`
- PostgreSQL container: `5432`
- Redis container: `6379`

외부 공개 주소는 리버스 프록시 기준으로 다음과 같습니다.

- Web: `https://kph.pjcloud.store`
- API: `https://kph.pjcloud.store/api/v1`
- OpenAPI: `https://kph.pjcloud.store/api/v1/openapi.json`

### 2. 리버스 프록시 연결 기준

현재 Compose는 `khp-net` 위에서 프록시가 서비스 이름으로 붙는 구성을 가장 자연스럽게 가정합니다.

예시 업스트림:

- Frontend -> `http://khp-frontend:3700`
- Backend API -> `http://khp-backend:8700`
- Backend WebSocket -> `http://khp-backend:8700`

현재 운영 도메인은 `kph.pjcloud.store`를 사용합니다.

### 3. 운영 예시

운영 구성은 다음 기준을 가정합니다.

- 프론트와 백엔드는 각각 Docker 컨테이너로 실행
- PostgreSQL은 서버에 기설치되어 있고, 애플리케이션용 DB `khp`만 추가
- Redis는 컨테이너로 실행
- 인증 방식은 이메일/비밀번호 + JWT
- 실명인증은 데모 범위 구현

참고 파일:

- 운영 Compose 예시: `docker-compose.prod.yml`
- 백엔드 환경 변수 예시: `backend/.env.example`

## 환경 변수 핵심값

백엔드 주요 환경 변수:

- `APP_PORT=8700`
- `API_V1_PREFIX=/api/v1`
- `DATABASE_URL=postgresql+psycopg://.../khp`
- `JWT_SECRET=...`
- `CORS_ALLOW_ORIGINS=http://localhost:3700,https://kph.pjcloud.store`
- `REDIS_URL=redis://...`
- `DEMO_IDENTITY_VERIFICATION=true`
- `DEMO_IDENTITY_CODE=000000`
- `APP_AUTO_INIT=false|true`

프론트 빌드 인자:

- `VITE_API_BASE_URL`
- `VITE_WS_BASE_URL`

프로덕션에서는 도메인 기준으로 다음 값을 사용합니다.

- `VITE_API_BASE_URL=https://kph.pjcloud.store/api/v1`
- `VITE_WS_BASE_URL=wss://kph.pjcloud.store`

## 참고 사항

- `docker-compose.demo.yml`과 `docker-compose.prod.yml` 모두 `restart: unless-stopped`를 사용합니다.
- 프론트 기본 파비콘과 브라우저 타이틀은 프로젝트 로고 기준으로 교체되어 있습니다.
- 실시간 메시지 브로드캐스트는 Redis pub/sub를 사용합니다.
- 데모 계정과 초기 데이터는 `APP_AUTO_INIT=true`일 때 백엔드 시작 시 자동 생성됩니다.

## 다음에 같이 보면 좋은 파일

- 프론트 라우팅: `frontend/src/app/router.tsx`
- 랜딩 페이지: `frontend/src/pages/LandingPage.tsx`
- 백엔드 엔트리포인트: `backend/app/main.py`
- 신고/콘솔 라우터: `backend/app/api/routers/console.py`
