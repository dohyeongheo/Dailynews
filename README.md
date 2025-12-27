# Daily News - 태국 및 한국 뉴스 요약 서비스

매일 Google Gemini API를 통해 태국 및 한국의 최신 뉴스를 수집하고, Supabase에 저장한 후 웹에 표시하는 서비스입니다.

## 기술 스택

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **AI API**: Google Gemini API
- **Language**: TypeScript

## 프로젝트 구조

```
Dailynews/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 루트 레이아웃
│   ├── page.tsx           # 메인 페이지
│   └── globals.css        # 전역 스타일
├── components/            # React 컴포넌트
│   ├── Header.tsx         # 헤더 (검색창, 뉴스 수집 버튼)
│   ├── NewsSection.tsx    # 카테고리별 뉴스 섹션
│   ├── NewsCard.tsx       # 개별 뉴스 카드
│   └── NewsListInfinite.tsx # 무한 스크롤 뉴스 리스트
├── app/                   # Next.js App Router
│   ├── api/              # API Routes
│   │   ├── cron/         # Cron Job 엔드포인트
│   │   └── manual/       # 수동 뉴스 수집 엔드포인트
├── lib/                   # 유틸리티 및 로직
│   ├── db/               # 데이터베이스 함수
│   │   ├── news.ts       # 뉴스 데이터베이스 함수
│   │   └── supabase-news.ts # Supabase 뉴스 함수
│   ├── supabase/         # Supabase 클라이언트
│   ├── news-fetcher.ts   # Google Gemini API 뉴스 수집 로직
│   └── actions.ts        # Server Actions
├── supabase/             # Supabase 관련 파일
│   └── schema.sql        # PostgreSQL 스키마
└── types/                # TypeScript 타입 정의
    └── news.ts           # 뉴스 관련 타입
```

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
# Google Gemini API (필수)
GOOGLE_GEMINI_API_KEY=your_google_gemini_api_key

# Supabase Configuration (필수)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 사용 방법

### 뉴스 수집

뉴스는 **매일 오전 6시 (태국 시간)**에 자동으로 수집됩니다. Vercel Cron Jobs를 통해 자동 실행됩니다.

#### 수동 뉴스 수집 (배포 서버)

필요한 경우 배포 서버에서 수동으로 뉴스 수집을 실행할 수 있습니다. 비밀번호 인증이 필요합니다.

**GET 요청:**
```bash
curl "https://your-domain.com/api/manual/fetch-news?password=YOUR_PASSWORD"
```

**POST 요청:**
```bash
curl -X POST "https://your-domain.com/api/manual/fetch-news" \
  -H "Content-Type: application/json" \
  -d '{"password": "YOUR_PASSWORD"}'
```

**환경 변수 설정:**
Vercel 환경 변수에 `MANUAL_FETCH_PASSWORD`를 설정하세요.

### 뉴스 카테고리

- **태국뉴스**: 태국에서 발생한 주요 뉴스
- **관련뉴스**: 한국에서 태국과 관련된 뉴스
- **한국뉴스**: 한국의 주요 뉴스

## 주요 기능

- ✅ Google Gemini API를 통한 뉴스 수집
- ✅ 매일 오전 6시 (태국 시간) 자동 뉴스 수집 (Vercel Cron Jobs)
- ✅ Supabase PostgreSQL 데이터베이스를 통한 뉴스 데이터 저장
- ✅ 카테고리별 뉴스 조회 및 표시
- ✅ 무한 스크롤을 통한 효율적인 뉴스 표시
- ✅ 뉴스 검색 기능 (헤더 검색창)
- ✅ 중복 뉴스 방지 로직
- ✅ AWS 스타일의 모던한 UI
- ✅ 태국 뉴스 영어 원문 자동 한국어 번역
- ✅ 에러 핸들링 및 성능 최적화

## 배포

### Supabase 설정

1. [Supabase](https://supabase.com)에서 프로젝트 생성
2. SQL Editor에서 `supabase/schema.sql` 파일의 내용을 실행하여 테이블 생성
3. SQL Editor에서 `supabase/migrations/enable_rls.sql` 파일의 내용을 실행하여 RLS 활성화 (보안 강화)
4. SQL Editor에서 `supabase/migrations/fix_function_search_path.sql` 파일의 내용을 실행하여 함수 보안 설정 (보안 강화)
5. Project Settings > API에서 다음 값 확인:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

### Vercel 배포

1. GitHub에 코드 푸시
2. [Vercel](https://vercel.com)에서 프로젝트 import
3. 환경 변수 설정:
   - `GOOGLE_GEMINI_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `MANUAL_FETCH_PASSWORD` (수동 뉴스 수집용 비밀번호, 선택사항)
   - `CRON_SECRET` (Cron Job 인증용, 선택사항)
4. 배포 완료!

## 문서

- [API 문서](docs/API.md) - API 엔드포인트 상세 문서
- [아키텍처 문서](docs/ARCHITECTURE.md) - 시스템 아키텍처 및 데이터 흐름

## 향후 계획

- [ ] 뉴스 상세 페이지
- [ ] 필터링 (날짜, 카테고리, 국가별)
- [ ] Redis를 통한 Rate Limiting 개선

## 라이선스

ISC

