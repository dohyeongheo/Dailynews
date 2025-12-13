# 아키텍처 문서

## 시스템 개요

Daily News는 Next.js 14+ App Router를 기반으로 한 서버리스 뉴스 수집 및 표시 서비스입니다.

## 기술 스택

- **Framework:** Next.js 14.2.5 (App Router)
- **Database:** Supabase (PostgreSQL)
- **AI API:** Google Gemini API (gemini-2.5-flash)
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Deployment:** Vercel
- **Monitoring:** Sentry
- **Logging:** Pino

## 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTP/HTTPS
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                      Vercel Edge Network                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Next.js App Router                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │  │
│  │  │   Pages      │  │  API Routes  │  │ Server      │ │  │
│  │  │              │  │              │  │ Actions     │ │  │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Supabase   │ │ Google Gemini│ │    Sentry    │
│  PostgreSQL  │ │     API      │ │  Monitoring  │
└──────────────┘ └──────────────┘ └──────────────┘
```

## 데이터 흐름

### 1. 뉴스 수집 프로세스

```
Vercel Cron Job (매일 오전 6시)
    │
    ▼
/api/cron/fetch-news
    │
    ▼
fetchAndSaveNewsAction()
    │
    ├─► fetchNewsFromGemini()
    │       │
    │       └─► Google Gemini API
    │               │
    │               └─► JSON 응답 (뉴스 데이터)
    │
    ├─► translateToKorean() (태국 뉴스만)
    │       │
    │       └─► Google Gemini API
    │
    └─► saveNewsToDatabase()
            │
            └─► Supabase PostgreSQL
                    │
                    └─► news 테이블에 저장
```

### 2. 뉴스 조회 프로세스

```
Client Request
    │
    ▼
Next.js Page Component
    │
    ▼
Server Action (getNewsByCategoryAction)
    │
    ▼
Supabase Query
    │
    ▼
PostgreSQL Database
    │
    ▼
News Data (JSON)
    │
    ▼
React Component (NewsCard)
    │
    ▼
Client Browser (렌더링)
```

## 디렉토리 구조

```
Dailynews/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── cron/             # Cron Job 엔드포인트
│   │   └── manual/           # 수동 뉴스 수집 엔드포인트
│   ├── category/             # 카테고리 페이지
│   ├── search/               # 검색 페이지
│   ├── admin/                # 관리자 페이지
│   ├── layout.tsx            # 루트 레이아웃
│   └── page.tsx              # 메인 페이지
├── components/               # React 컴포넌트
│   ├── Header.tsx            # 헤더 컴포넌트
│   ├── NewsCard.tsx          # 뉴스 카드 컴포넌트
│   ├── NewsSection.tsx       # 뉴스 섹션 컴포넌트
│   ├── NewsListInfinite.tsx  # 무한 스크롤 리스트
│   ├── ErrorBoundary.tsx     # 에러 바운더리
│   ├── ErrorDisplay.tsx      # 에러 표시 컴포넌트
│   └── LoadingSkeleton.tsx   # 로딩 스켈레톤
├── lib/                      # 유틸리티 및 로직
│   ├── actions.ts            # Server Actions
│   ├── news-fetcher.ts       # 뉴스 수집 로직
│   ├── errors.ts             # 에러 핸들링
│   ├── config/               # 설정
│   │   └── env.ts            # 환경 변수 검증
│   ├── utils/                # 유틸리티
│   │   ├── logger.ts         # 로깅
│   │   ├── rate-limit.ts     # Rate Limiting
│   │   └── validation.ts     # 입력 검증
│   ├── db/                   # 데이터베이스 함수
│   │   ├── news.ts           # 뉴스 DB 함수 (래퍼)
│   │   └── supabase-news.ts  # Supabase 뉴스 함수
│   └── supabase/             # Supabase 클라이언트
│       ├── client.ts         # 클라이언트 사이드
│       └── server.ts          # 서버 사이드
├── types/                    # TypeScript 타입 정의
│   └── news.ts               # 뉴스 관련 타입
├── supabase/                 # Supabase 관련 파일
│   └── schema.sql            # 데이터베이스 스키마
├── __tests__/                # 테스트 파일
└── docs/                     # 문서
    ├── API.md                # API 문서
    └── ARCHITECTURE.md        # 아키텍처 문서
```

## 주요 컴포넌트

### 1. 뉴스 수집 모듈 (`lib/news-fetcher.ts`)

- Google Gemini API를 통한 뉴스 수집
- 한국어 번역 (태국 뉴스)
- JSON 파싱 및 검증
- 에러 핸들링 및 재시도 로직

### 2. 데이터베이스 모듈 (`lib/db/`)

- Supabase를 통한 데이터 저장/조회
- 중복 뉴스 방지
- 페이지네이션 지원
- 검색 기능

### 3. 보안 모듈 (`lib/utils/`)

- Rate Limiting
- Input Validation (Zod)
- XSS 방지
- SQL Injection 방지 (Supabase 자동 처리)

### 4. 로깅 모듈 (`lib/utils/logger.ts`)

- 구조화된 로깅 (Pino)
- 로그 레벨 관리
- 성능 측정

## 보안

### 인증 및 인가

- **수동 뉴스 수집:** 비밀번호 인증 (`MANUAL_FETCH_PASSWORD`)
- **Cron Job:** Vercel 내부 인증 또는 `CRON_SECRET`

### Rate Limiting

- 수동 뉴스 수집 API: 10분에 5회 요청 제한
- IP 기반 추적

### Input Validation

- Zod를 사용한 런타임 타입 검증
- XSS 방지 (HTML 이스케이프)
- SQL Injection 방지 (Supabase 자동 처리)

## 성능 최적화

### 1. 캐싱

- 페이지 캐싱: `revalidate = 60` (60초)
- Next.js 자동 캐싱

### 2. 코드 분할

- 동적 임포트 (`dynamic()`)
- React.memo를 통한 리렌더링 최적화

### 3. 데이터베이스

- 인덱스 최적화
- 페이지네이션
- 배치 처리

## 모니터링 및 로깅

### Sentry

- 에러 추적
- 성능 모니터링
- 릴리스 추적

### Pino 로깅

- 구조화된 로그
- 로그 레벨 관리
- 개발 환경 Pretty Print

## 배포

### Vercel

- Serverless Functions
- Edge Network
- 자동 배포 (GitHub 연동)

### 환경 변수

- Vercel 대시보드에서 관리
- 앱 시작 시 자동 검증

## 확장성

### 현재 제한사항

- Vercel Serverless Functions 타임아웃 (300초)
- 메모리 기반 Rate Limiting (서버리스 환경)

### 향후 개선 방향

- Redis를 통한 Rate Limiting
- 데이터베이스 연결 풀 최적화
- CDN 캐싱 전략 개선

