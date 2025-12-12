# Daily News - 태국 및 한국 뉴스 요약 서비스

매일 Google Gemini API를 통해 태국 및 한국의 최신 뉴스를 수집하고, Supabase에 저장한 후 웹에 표시하는 서비스입니다.

## 기술 스택

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **Database**: SQLite (로컬 개발) / Supabase (배포 시)
- **AI API**: Google Gemini API (Search Grounding 기능 활용)
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
│   └── FetchNewsButton.tsx # 뉴스 수집 버튼 (로컬 테스트용)
├── lib/                   # 유틸리티 및 로직
│   ├── db/               # 로컬 데이터베이스 (SQLite)
│   │   ├── database.ts   # 데이터베이스 초기화
│   │   └── news.ts       # 뉴스 데이터베이스 함수
│   ├── supabase/         # Supabase 클라이언트 (배포 시 사용)
│   ├── news-fetcher.ts   # Google Gemini API 뉴스 수집 로직
│   └── actions.ts        # Server Actions
├── supabase/             # Supabase 관련 파일
│   └── schema.sql        # PostgreSQL 스키마 (배포 시 사용)
├── data/                 # 로컬 데이터베이스 파일 (자동 생성)
│   └── news.db           # SQLite 데이터베이스
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

# Supabase Configuration (배포 시 필수)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# 데이터베이스 타입 선택 (sqlite 또는 supabase)
# 로컬 개발 시: sqlite (기본값)
# 배포 시: supabase
DB_TYPE=supabase
```

**참고**: 
- 로컬 개발 환경에서는 기본적으로 SQLite 데이터베이스를 사용합니다 (`DB_TYPE=sqlite` 또는 미설정 시)
- 배포 시에는 `DB_TYPE=supabase`로 설정하고 Supabase 환경 변수를 설정하세요
- 데이터베이스 파일은 `data/news.db`에 자동으로 생성됩니다

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 사용 방법

### 로컬 테스트

1. 웹 페이지 상단의 **"뉴스 수집"** 버튼을 클릭
2. Google Gemini API를 통해 뉴스가 수집되고 로컬 SQLite 데이터베이스(`data/news.db`)에 저장됩니다
3. 수집이 완료되면 페이지가 자동으로 새로고침되어 뉴스가 표시됩니다

**참고**: 데이터베이스 파일은 프로젝트 루트의 `data/` 디렉토리에 자동으로 생성됩니다.

### 뉴스 카테고리

- **태국뉴스**: 태국에서 발생한 주요 뉴스
- **관련뉴스**: 한국에서 태국과 관련된 뉴스
- **한국뉴스**: 한국의 주요 뉴스

## 주요 기능

- ✅ Google Gemini API를 통한 뉴스 수집 (Search Grounding 기능 활용)
- ✅ 로컬 SQLite 데이터베이스를 통한 뉴스 데이터 저장 (로컬 개발)
- ✅ Supabase PostgreSQL 데이터베이스 지원 (배포 시)
- ✅ 환경 변수로 DB 타입 선택 가능 (SQLite ↔ Supabase)
- ✅ 카테고리별 뉴스 조회 및 표시
- ✅ 뉴스 검색 기능 (헤더 검색창)
- ✅ AWS 스타일의 모던한 UI
- ✅ 태국 뉴스 영어 원문 자동 한국어 번역

## 배포

### Supabase 설정

1. [Supabase](https://supabase.com)에서 프로젝트 생성
2. SQL Editor에서 `supabase/schema.sql` 파일의 내용을 실행하여 테이블 생성
3. Project Settings > API에서 다음 값 확인:
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
   - `DB_TYPE=supabase`
4. 배포 완료!

## 향후 계획

- [ ] 자동 크론 작업 설정 (매일 아침 7시 뉴스 수집)
- [ ] 뉴스 상세 페이지
- [ ] 페이지네이션
- [ ] 필터링 (날짜, 카테고리, 국가별)
- [ ] 에러 핸들링 및 로깅 개선
- [ ] 테스트 코드 작성

## 라이선스

ISC

