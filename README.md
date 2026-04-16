<div align="center">

# K-Phishing Hunterz

실전처럼 연습하고, 안전하게 대응하자.

[Live Demo](https://kph.pjcloud.store) ·
[PRD](./PRD.md) ·
[Frontend Spec](./FRONTEND_SPEC.md) ·
[Backend Spec](./BACKEND_SPEC.md)

<p>
  <img src="https://img.shields.io/badge/React-19-111827?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-7-111827?style=flat-square&logo=vite" alt="Vite 7" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-111827?style=flat-square&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-111827?style=flat-square&logo=postgresql" alt="PostgreSQL 16" />
  <img src="https://img.shields.io/badge/Redis-7-111827?style=flat-square&logo=redis" alt="Redis 7" />
  <img src="https://img.shields.io/badge/Docker-Compose-111827?style=flat-square&logo=docker" alt="Docker Compose" />
</p>

</div>

## About

K-Phishing Hunterz는 보이스피싱·스캠 대응을 위한 시민 참여형 웹 데모입니다.  
원 기획은 모바일 앱이지만, 현재 구현은 모바일 앱처럼 보이고 동작하는 웹 데모 흐름에 맞춰 구성되어 있습니다.

사용자는 헌터 온보딩을 거쳐 미끼를 배포하고, 사기 시나리오를 관전하거나 검토하고,  
수집된 정보를 신고·검증·보상 흐름으로 이어갈 수 있습니다.

## Overview

| Area | Description |
| --- | --- |
| Onboarding | 실명인증(데모), 교육, 테스트, 서약, 자격증 발급 |
| Hunter | 미끼 목록, 미끼 상세, 사냥 세션, 신고, 포인트/보상, 랭킹, 알림 |
| Console | 신고 승인 큐, 모니터링, 사용자 관리, 보상 처리, 시뮬레이터, 콘텐츠 관리, 감사 로그 |
| Realtime | WebSocket 기반 사냥 세션 중계 |
| Deploy | Docker 기반 프론트/백엔드, PostgreSQL, Redis, Nginx 연동 |

## Stack

| Layer | Tech |
| --- | --- |
| Frontend | React 19, Vite, React Router, TanStack Query, Zustand, Tailwind CSS |
| Backend | FastAPI, SQLAlchemy, Alembic, Uvicorn |
| Database | PostgreSQL 16 |
| Cache / Realtime | Redis 7 |
| Infra | Docker Compose, Nginx, Let's Encrypt |

## Team

| GitHub | Profile |
| --- | --- |
| `Krminsung` | https://github.com/Krminsung |
| `527NotFound` | https://github.com/527NotFound |
| `18choyeonwoo` | https://github.com/18choyeonwoo |
| `juin925` | https://github.com/juin925 |
| `nannanyeee` | https://github.com/nannanyeee |

## Documents

- 기획서: `PRD.md`
- 프론트 상세 명세: `FRONTEND_SPEC.md`
- 백엔드 상세 명세: `BACKEND_SPEC.md`

## Demo Accounts

| Role | Email | Password |
| --- | --- | --- |
| Hunter | `hunter@kph.pjcloud.store` | `hunter1234` |
| Police | `police@kph.pjcloud.store` | `police1234` |
| Admin | `admin@kph.pjcloud.store` | `admin1234` |

- 데모 본인인증 코드: `000000`

## Run

### 1. Prepare network

현재 Compose는 리버스 프록시가 같은 Docker 네트워크에 붙는 서버형 구성을 기준으로 작성되어 있습니다.

```bash
docker network create khp-net
```

### 2. Start demo stack

```bash
docker-compose -f docker-compose.demo.yml up -d --build
```

### 3. Public endpoints

- Web: `https://kph.pjcloud.store`
- API: `https://kph.pjcloud.store/api/v1`
- OpenAPI: `https://kph.pjcloud.store/api/v1/openapi.json`

## Deployment Notes

- 프론트/백엔드 컨테이너는 `ports`가 아니라 `expose`를 사용합니다.
- 외부 접속은 리버스 프록시가 처리합니다.
- 외부 네트워크 이름은 `khp-net`입니다.
- PostgreSQL은 애플리케이션용 DB `khp`를 기준으로 구성되어 있습니다.
- 운영 예시는 `docker-compose.prod.yml`과 `backend/.env.example`를 기준으로 맞추면 됩니다.

예시 업스트림:

- Frontend -> `http://khp-frontend:3700`
- Backend API -> `http://khp-backend:8700`
- Backend WebSocket -> `http://khp-backend:8700`

## Repository Structure

```text
.
|-- backend
|-- frontend
|-- deploy
|-- PRD.md
|-- FRONTEND_SPEC.md
|-- BACKEND_SPEC.md
|-- docker-compose.demo.yml
`-- docker-compose.prod.yml
```

## Notes

- `docker-compose.demo.yml`과 `docker-compose.prod.yml` 모두 `restart: unless-stopped`를 사용합니다.
- 프론트 파비콘과 브라우저 타이틀은 프로젝트 이름 기준으로 교체되어 있습니다.
- 실시간 브로드캐스트는 Redis pub/sub를 사용합니다.
- `APP_AUTO_INIT=true`일 때 백엔드 시작 시 초기 데이터와 데모 계정이 자동 생성됩니다.
