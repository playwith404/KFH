<!-- 헤더 웨이브 배너 -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0F766E,35:2563EB,70:111827,100:EF4444&height=120&section=header&text=&fontSize=0" width="100%"/>

<div align="center">

<img src="frontend/public/kph-favicon.svg" alt="K-Phishing Hunterz Logo" width="160"/>

<br/><br/>

<a href="https://git.io/typing-svg">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=34&pause=1000&color=0F766E&center=true&vCenter=true&random=false&width=760&height=90&lines=%F0%9F%8E%AF+K-Phishing+Hunterz;%F0%9F%8E%A3+%ED%94%BC%EC%8B%B1%EC%97%90%EA%B2%8C%EB%A1%9C+%EB%82%B4%EA%B0%80+%EA%B0%84%EB%8B%A4;%F0%9F%9B%A1%EF%B8%8F+Practice+Like+Real" alt="Typing SVG" />
</a>

<br/>

<img src="https://img.shields.io/badge/we_are-Playwith404-2563EB?style=for-the-badge"/>

<br/><br/>

<img src="https://img.shields.io/badge/version-demo-0F766E?style=flat-square"/>
<img src="https://img.shields.io/badge/status-development-F59E0B?style=flat-square"/>
<img src="https://img.shields.io/badge/team-5_members-EF4444?style=flat-square"/>
<img src="https://img.shields.io/badge/domain-kph.pjcloud.store-111827?style=flat-square"/>

<br/><br/>

[![Contributors](https://img.shields.io/github/contributors/playwith404/KFH?style=for-the-badge&logo=github&logoColor=white&labelColor=gray&color=00C853)](https://github.com/playwith404/KFH/graphs/contributors)
[![Commits](https://img.shields.io/github/commit-activity/t/playwith404/KFH?style=for-the-badge&logo=github&logoColor=white&labelColor=gray&color=FF6D00)](https://github.com/playwith404/KFH/commits/main)
[![Last Commit](https://img.shields.io/github/last-commit/playwith404/KFH?style=for-the-badge&logo=git&logoColor=white&labelColor=gray&color=2962FF)](https://github.com/playwith404/KFH/commits/main)
[![Top Language](https://img.shields.io/github/languages/top/playwith404/KFH?style=for-the-badge&logo=typescript&logoColor=white&labelColor=gray&color=8E24AA)](https://github.com/playwith404/KFH)

<br/><br/>

[![프로젝트 소개](https://img.shields.io/badge/프로젝트_소개-0F766E?style=for-the-badge&logo=readme&logoColor=white)](#-프로젝트-소개)
[![주요 기능](https://img.shields.io/badge/주요_기능-2563EB?style=for-the-badge&logo=googlemessages&logoColor=white)](#-주요-기능)
[![시스템 아키텍처](https://img.shields.io/badge/아키텍처-7C3AED?style=for-the-badge&logo=diagramsdotnet&logoColor=white)](#-시스템-아키텍처)
[![기술 스택](https://img.shields.io/badge/기술_스택-EF4444?style=for-the-badge&logo=stackshare&logoColor=white)](#-기술-스택)
[![시작하기](https://img.shields.io/badge/시작하기-F59E0B?style=for-the-badge&logo=rocket&logoColor=white)](#-시작하기)
[![팀원 소개](https://img.shields.io/badge/팀원_소개-111827?style=for-the-badge&logo=github&logoColor=white)](#-team)

</div>

<br/>

<img src="https://user-images.githubusercontent.com/74038190/212750526-f95ef1ec-8d84-4f07-9d0b-6f0cc5d4f5db.gif" width="100%">

## 📋 목차

- [프로젝트 소개](#-프로젝트-소개)
- [핵심 컨셉](#-핵심-컨셉)
- [주요 기능](#-주요-기능)
- [서비스 흐름](#-서비스-흐름)
- [시스템 아키텍처](#-시스템-아키텍처)
- [기술 스택](#-기술-스택)
- [시작하기](#-시작하기)
- [프로젝트 구조](#-프로젝트-구조)
- [Team](#-team)
- [Contact](#-contact)

<br/>

## 🚀 프로젝트 소개

> **"피싱이 온다는 말은 너무 수동적이다. 내가 피싱에게로 간다."**

**케이팝 피싱 헌터즈 (K-Phishing Hunterz)** 는 보이스피싱과 스캠을 **역으로 낚아** 사기꾼의 정보를 수집하고, 그들의 데이터베이스를 오염시켜 범죄 생태계의 경제성을 무너뜨리는 **시민 참여형 사이버 수사 협력 플랫폼**입니다.

경찰청 사이버범죄 예방 공모전을 위해 기획된 본 프로젝트는, 실제 앱 기획을 **웹 데모**로 먼저 구현한 형태입니다. React + Vite 프론트엔드와 FastAPI 백엔드를 Docker 기반으로 분리 운영하며, 모바일 앱과 유사한 단일 컬럼 레이아웃을 제공합니다.

<br/>

### 🧐 왜 이 프로젝트인가?

사기꾼들은 효율성을 극도로 따지는 집단입니다. 그들이 수집한 DB에 **가짜 정보가 90% 이상** 섞여버리면, 사기를 치기 위한 리소스가 결과(수익)보다 커지게 되어 **범죄 생태계 자체가 무너집니다**.

이것이 바로 **데이터 오염(Data Poisoning) 전략**입니다.

<div align="center">

| 구분 | 1년차 목표 | 3년차 목표 | 5년차 목표 |
|:---:|:---:|:---:|:---:|
| 헌터 등록 | 10,000명 | 50,000명 | - |
| 미끼 배포 | 100,000건 | 500,000건 | - |
| 예상 피해 방지액 | 50억원 | 300억원 | 700억원 |
| DB 오염률 | 20% | 40% | 60% |

</div>

<br/>

## 🎯 핵심 컨셉

<div align="center">

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│    🎣 미끼 살포        →   🪤 사기꾼 낚시       →   🔍 정보 추출            │
│    가짜 프로필 배포         AI가 실시간 응대          계좌/URL/IP 자동 추출    │
│                                                                              │
│    ✅ 3단계 검증       →   🚔 기관 전송          →   🏆 보상 지급            │
│    AI → 헌터 → 경찰        금융결제원/경찰 DB         포인트/등급/명예         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

</div>

<br/>

## ✨ 주요 기능

### 🎖️ 명예 케피헌 온보딩
> 실명 인증 → 교육 이수(2시간) → 대응 테스트(80점 이상) → 서약서 전자서명 → 자격증 발급

회원가입 후 4단계 온보딩을 거치면 **명예 케피헌(K-Phishing Hunter)** 으로 임명되어 가상 번호 및 미끼 ID를 발급받습니다.

### 🪤 미끼 배포 시스템
> 급처 피해자형 / 대출 희망자형 / 투자 입문자형 / 로맨스 취약자형

정상 거래자가 연락할 이유가 없는 구조로 설계된 표준화 미끼를 커뮤니티에 배포하여, 사기꾼의 자발적 접근을 유도합니다.

### 🎣 AI 페르소나 실시간 대응
> 어리숙한 노인 / IT 서툰 중장년 / 급한 직장인 / 순진한 대학생

사기 수법에 맞는 최적의 AI 페르소나가 자동 매칭되어 사기꾼과 대화합니다. 헌터는 실시간 관전 모드로 참여하며, 계좌번호/URL/IP 등이 자동 추출됩니다.

### 🔍 3단계 검증 시스템
> AI 1차 판정 → 헌터 2차 검토 → 경찰 3차 승인

5대 사기 지표 AI 분석, 8개 항목 체크리스트 헌터 검토, 담당 수사관 최종 승인의 삼중 검증으로 **오탐을 최소화**합니다. 동일 증거에 대해 2명 이상의 헌터가 독립 신고해야 수사 의뢰되는 **교차검증** 시스템을 적용합니다.

### 🏆 포인트 & 등급 시스템
> 훈련생 → 루키 → 레귤러 → 엘리트 → 마스터

미끼 배포(+10P)부터 조직 검거 기여(+3,000P)까지 활동 기반 보상을 제공합니다. 주간/월간 랭킹, 지역별 대항전, 연말 시상식 등 경쟁 요소로 지속적 참여를 유도합니다.

### 🗺️ 데이터 오염 현황 (Global View)
> 전국 지도 기반 실시간 시각화

케피헌들의 미끼에 낚인 사기꾼의 위치(IP 기반) 실시간 표시, 지역별 히트맵, 전체 오염도 지표를 대시보드로 제공합니다.

### 🛡️ 경찰/운영 콘솔
> 신고 승인 큐 / 모니터링 대상 관리 / 사용자·콘텐츠·보상 관리 / 감사 로그

경찰 수사관과 운영자를 위한 전용 콘솔에서 3차 검증 처리, 오탐 관리, 교육 콘텐츠 관리 등을 수행합니다.

<br/>

## 🔄 서비스 흐름

```
                          ┌─────────────────────┐
                          │   SCENE 1. 온보딩    │
                          │  실명인증 → 교육 →   │
                          │  테스트 → 서약 발급   │
                          └──────────┬──────────┘
                                     │
                          ┌──────────▼──────────┐
                          │  SCENE 2. 미끼 살포   │
                          │  미끼 선택 → 배포 →   │
                          │  사기꾼 접근 대기      │
                          └──────────┬──────────┘
                                     │
                          ┌──────────▼──────────┐
                          │  SCENE 3. 낚시 성공   │
                          │  사기꾼 유입 감지 →   │
                          │  AI 페르소나 자동 응대 │
                          │  헌터 실시간 관전      │
                          └──────────┬──────────┘
                                     │
                          ┌──────────▼──────────┐
                          │  SCENE 4. 정보 추출   │
                          │  계좌/URL/IP 자동 추출 │
                          │  → 신고 요청           │
                          └──────────┬──────────┘
                                     │
                          ┌──────────▼──────────┐
                          │  SCENE 5. 3단계 검증  │
                          │  AI 판정 → 헌터 검토  │
                          │  → 경찰 승인           │
                          └──────────┬──────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                 │
         ┌──────────▼──┐  ┌─────────▼──────┐  ┌──────▼────────┐
         │ SCENE 6.    │  │ SCENE 7.       │  │  기관 전송     │
         │ 보상 지급   │  │ 오염 현황 확인  │  │ 금융결제원/DB  │
         └─────────────┘  └────────────────┘  └───────────────┘
```

<br/>

## 🏗 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Hunter Terminal (Web App)                        │
│            React 19 + Vite + TypeScript + Tailwind CSS              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ 온보딩   │  │ 미끼관리 │  │ 사냥모니터│  │ 보상/랭킹│            │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                          │
│  │ 신고관리 │  │ 글로벌뷰 │  │ 운영콘솔 │  ← RBAC 기반 접근 제어  │
│  └──────────┘  └──────────┘  └──────────┘                          │
└────────────────────────┬────────────────────────────────────────────┘
                         │ REST API + WebSocket
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   Backend (FastAPI + Python 3.11)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  13 Routers  │  │  7 Services  │  │  WebSocket   │              │
│  │  (REST API)  │  │ (Biz Logic)  │  │  Manager     │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ JWT Auth     │  │  RBAC        │  │  28 Models   │              │
│  │ + Sessions   │  │  Middleware   │  │  (ORM)       │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└────────────────────────┬────────────────────────────────────────────┘
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
┌──────────────────┐    ┌──────────────────┐
│   PostgreSQL 16  │    │    Redis 7       │
│   (28 테이블)    │    │  (캐시/세션)     │
└──────────────────┘    └──────────────────┘
```

<br/>

## 🛠 기술 스택

<div align="center">

| 분류 | 기술 |
|:---:|:---|
| **Frontend** | <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB"/> <img src="https://img.shields.io/badge/Vite_7-646CFF?style=for-the-badge&logo=vite&logoColor=white"/> <img src="https://img.shields.io/badge/TypeScript_5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/> <img src="https://img.shields.io/badge/Tailwind_CSS-0F172A?style=for-the-badge&logo=tailwindcss&logoColor=38BDF8"/> <br/> <img src="https://img.shields.io/badge/React_Router_7-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white"/> <img src="https://img.shields.io/badge/TanStack_Query-FF4154?style=for-the-badge&logo=reactquery&logoColor=white"/> <img src="https://img.shields.io/badge/Zustand-433E38?style=for-the-badge&logo=react&logoColor=white"/> <img src="https://img.shields.io/badge/React_Hook_Form-EC5990?style=for-the-badge&logo=reacthookform&logoColor=white"/> <img src="https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white"/> |
| **Backend** | <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white"/> <img src="https://img.shields.io/badge/Python_3.11-3776AB?style=for-the-badge&logo=python&logoColor=white"/> <img src="https://img.shields.io/badge/SQLAlchemy_2.0-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white"/> <img src="https://img.shields.io/badge/Alembic-6BA81E?style=for-the-badge&logo=alembic&logoColor=white"/> <img src="https://img.shields.io/badge/Pydantic_v2-E92063?style=for-the-badge&logo=pydantic&logoColor=white"/> <img src="https://img.shields.io/badge/JWT-111827?style=for-the-badge&logo=jsonwebtokens&logoColor=white"/> |
| **Database & Infra** | <img src="https://img.shields.io/badge/PostgreSQL_16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white"/> <img src="https://img.shields.io/badge/Redis_7-DC382D?style=for-the-badge&logo=redis&logoColor=white"/> <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white"/> <img src="https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white"/> <img src="https://img.shields.io/badge/Let's_Encrypt-003A70?style=for-the-badge&logo=letsencrypt&logoColor=white"/> |

</div>

<br/>

## 📦 시작하기

### 1. 사전 준비

- Docker / Docker Compose 설치
- 외부 Docker 네트워크 생성

```bash
docker network create khp-net
```

### 2. 환경 변수 확인

| 항목 | 기본값 | 설명 |
|------|--------|------|
| 프론트엔드 포트 | `3700` | React 웹앱 |
| 백엔드 포트 | `8700` | FastAPI 서버 |
| PostgreSQL | `5432` | 데이터베이스 |
| Redis | `6379` | 캐시/세션 |
| 도메인 | `kph.pjcloud.store` | 운영 도메인 |

### 3. 데모 실행

```bash
# 프로젝트 클론
git clone https://github.com/playwith404/KFH.git
cd KFH

# 데모 환경 실행 (PostgreSQL + Redis + Backend + Frontend 일괄 기동)
docker compose -f docker-compose.demo.yml up -d --build
```

> **데모 모드**에서는 실명인증이 `DEMO` 코드(`000000`)로 대체되며, 서버 기동 시 테이블 자동 생성 및 시드 데이터가 적용됩니다.

### 4. 프로덕션 실행

```bash
# 프로덕션 환경 (PostgreSQL은 호스트에 사전 설치 필요)
docker compose -f docker-compose.prod.yml up -d --build
```

### 5. 접속

| 구분 | URL |
|------|-----|
| Web | `https://kph.pjcloud.store` |
| API | `https://kph.pjcloud.store/api` |
| API Docs (Swagger) | `https://kph.pjcloud.store/api/docs` |

<br/>

## 📁 프로젝트 구조

```bash
📦 KFH
├── 📂 backend                     # FastAPI 백엔드
│   ├── 📂 app
│   │   ├── 📂 api/routers         # 13개 API 라우터
│   │   │   ├── auth.py            #   인증 (로그인/회원가입/JWT)
│   │   │   ├── onboarding.py      #   온보딩 (실명인증/교육/테스트/서약)
│   │   │   ├── baits.py           #   미끼 관리/배포
│   │   │   ├── hunt.py            #   사냥 세션/실시간 관전
│   │   │   ├── reports.py         #   신고/검증
│   │   │   ├── console.py         #   경찰/운영 콘솔
│   │   │   ├── points.py          #   포인트 원장
│   │   │   ├── rewards.py         #   보상 교환
│   │   │   ├── ranking.py         #   랭킹
│   │   │   ├── analytics.py       #   분석/지표
│   │   │   └── notifications.py   #   알림
│   │   ├── 📂 core                # 설정/보안/RBAC
│   │   ├── 📂 db                  # DB 세션/베이스 모델
│   │   ├── 📂 models              # 28개 SQLAlchemy ORM 모델
│   │   ├── 📂 schemas             # Pydantic 요청/응답 스키마
│   │   ├── 📂 services            # 비즈니스 로직 레이어
│   │   ├── 📂 websocket           # WebSocket 매니저
│   │   └── main.py                # FastAPI 앱 팩토리
│   ├── 📂 alembic                 # DB 마이그레이션
│   ├── 📂 scripts                 # 유틸리티 스크립트
│   ├── Dockerfile
│   └── requirements.txt
│
├── 📂 frontend                    # React + Vite 프론트엔드
│   ├── 📂 src
│   │   ├── 📂 api                 # Axios 클라이언트/React Query 훅/타입
│   │   ├── 📂 app                 # App.tsx + 라우터 설정
│   │   ├── 📂 components
│   │   │   ├── 📂 guards          #   RequireAuth/RequireRole/RequireHunterVerified
│   │   │   ├── 📂 layout          #   AppShell/ConsoleShell/MobileFrame/TopBar/BottomNav
│   │   │   └── 📂 ui              #   Button/Card/Input/Badge/Select/Textarea
│   │   ├── 📂 pages
│   │   │   ├── 📂 onboarding      #   6개 온보딩 페이지
│   │   │   ├── 📂 app             #   12개 헌터 앱 페이지
│   │   │   ├── 📂 console         #   9개 관리 콘솔 페이지
│   │   │   └── 📂 legal           #   이용약관/개인정보처리방침
│   │   └── 📂 stores              # Zustand 상태 관리
│   ├── 📂 public                  # 정적 에셋
│   ├── Dockerfile
│   └── package.json
│
├── 📂 deploy                      # 배포 설정
│   └── nginx.kph.pjcloud.store.conf
│
├── docker-compose.demo.yml        # 데모 환경 (DB 포함)
├── docker-compose.prod.yml        # 프로덕션 환경
├── PRD.md                         # 기획서 (Product Requirements Document)
├── BACKEND_SPEC.md                # 백엔드 상세명세서
├── FRONTEND_SPEC.md               # 프론트엔드 상세명세서
└── README.md
```

<br/>

## 👥 Team

<div align="center">

| <img src="https://avatars.githubusercontent.com/u/120772177?v=4" width="120"/><br/><br/>**Krminsung**<br/><br/>[![GitHub](https://img.shields.io/badge/GitHub-Krminsung-181717?style=for-the-badge&logo=github)](https://github.com/Krminsung) | <img src="https://avatars.githubusercontent.com/u/131033715?v=4" width="120"/><br/><br/>**527NotFound**<br/><br/>[![GitHub](https://img.shields.io/badge/GitHub-527NotFound-181717?style=for-the-badge&logo=github)](https://github.com/527NotFound) | <img src="https://avatars.githubusercontent.com/u/203737204?v=4" width="120"/><br/><br/>**18choyeonwoo**<br/><br/>[![GitHub](https://img.shields.io/badge/GitHub-18choyeonwoo-181717?style=for-the-badge&logo=github)](https://github.com/18choyeonwoo) |
|:---:|:---:|:---:|
| <img src="https://avatars.githubusercontent.com/u/101376856?v=4" width="120"/><br/><br/>**juin925**<br/><br/>[![GitHub](https://img.shields.io/badge/GitHub-juin925-181717?style=for-the-badge&logo=github)](https://github.com/juin925) | <img src="https://avatars.githubusercontent.com/u/167386973?v=4" width="120"/><br/><br/>**nannanyeee**<br/><br/>[![GitHub](https://img.shields.io/badge/GitHub-nannanyeee-181717?style=for-the-badge&logo=github)](https://github.com/nannanyeee) | |

</div>

<br/>

<img src="https://user-images.githubusercontent.com/74038190/216649433-0b7e43fe-6c55-49e3-8f84-6e6f9c4c2162.gif" width="100%">

## 📞 Contact

<div align="center">

[![GitHub](https://img.shields.io/badge/GitHub-playwith404%2FKFH-181717?style=for-the-badge&logo=github)](https://github.com/playwith404/KFH)
[![Live Demo](https://img.shields.io/badge/Live-kph.pjcloud.store-0F766E?style=for-the-badge&logo=googlechrome&logoColor=white)](https://kph.pjcloud.store)
[![Email](https://img.shields.io/badge/Email-playwith404%40gmail.com-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:playwith404@gmail.com)

</div>

<br/>

<div align="center">

![Visitor Count](https://komarev.com/ghpvc/?username=playwith404-KFH&color=0F766E&style=for-the-badge)

</div>

<br/>

<div align="center">
  <sub>Built with passion by <b>playwith404</b> Team</sub>
</div>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0F766E,35:2563EB,70:111827,100:EF4444&height=120&section=footer&text=&fontSize=0" width="100%"/>
