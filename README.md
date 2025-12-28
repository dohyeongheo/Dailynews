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

### 방법 1: Dev Container 사용 (권장)

VS Code/Cursor의 Dev Containers 확장을 사용하면 Docker 환경에서 자동으로 개발 환경이 구성됩니다.

#### 필수 사전 요구사항

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 설치 및 실행
- VS Code/Cursor에 "Dev Containers" 확장 설치

#### 시작하기

1. Docker Desktop 실행
2. VS Code/Cursor에서 프로젝트 폴더 열기
3. 명령 팔레트(`Ctrl+Shift+P` / `Cmd+Shift+P`)에서 **"Dev Containers: Reopen in Container"** 실행
4. 컨테이너가 빌드되고 연결되면 자동으로 개발 서버가 시작됩니다

> 💡 **팁**: 자세한 사용 방법은 [개발 환경 가이드](docs/DEVELOPMENT.md)를 참고하세요.

### 방법 2: 로컬 설치

#### 1. 의존성 설치

```bash
npm install
```

#### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
# Google Gemini API (필수)
GOOGLE_GEMINI_API_KEY=your_google_gemini_api_key

# Supabase Configuration (필수)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# 관리자 페이지 접속 비밀번호 (선택사항, 관리자 페이지 접속 시 필요)
ADMIN_PASSWORD=your_admin_password

```

> 💡 **팁**: `.env.example` 파일을 참고하여 필요한 환경 변수를 확인할 수 있습니다.

#### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 사용 방법

### 뉴스 수집

뉴스는 **매일 오전 6시 (태국 시간)**에 자동으로 수집됩니다. GitHub Actions를 통해 자동 실행됩니다.

#### GitHub Actions 자동 수집

- **스케줄**: 매일 UTC 23시 (태국 시간 오전 6시)
- **워크플로우**: `.github/workflows/fetch-news.yml`
- **수동 실행**: GitHub 저장소의 Actions 탭에서 `workflow_dispatch`로 수동 실행 가능

#### 수동 뉴스 수집 (로컬)

로컬에서 뉴스를 수집하려면:

```bash
npm run fetch-news
```

#### 수동 뉴스 수집 (배포 서버)

### 관리자 페이지 접속

관리자 페이지(`/admin`)에 접속하려면 비밀번호 인증이 필요합니다.

#### 1. 환경 변수 설정

`.env.local` 파일에 `ADMIN_PASSWORD`를 설정하세요:

```env
ADMIN_PASSWORD=your_secure_password_here
```

**로컬 개발 환경:**

- `.env.local` 파일에 `ADMIN_PASSWORD` 추가

**Vercel 배포 환경:**

1. Vercel 대시보드 → 프로젝트 선택
2. Settings → Environment Variables
3. `ADMIN_PASSWORD` 추가 (모든 환경에 적용)

#### 2. 관리자 페이지 접속 방법

1. 브라우저에서 `/admin/login` 페이지로 이동
2. 설정한 `ADMIN_PASSWORD` 입력
3. 로그인 성공 시 `/admin` 페이지로 자동 리다이렉트

#### 3. 관리자 페이지 기능

- **뉴스 관리**: 뉴스 생성, 수정, 삭제
- **댓글 관리**: 댓글 조회 및 삭제
- **사용자 관리**: 사용자 조회 및 역할 변경

#### 4. 보안 주의사항

- `ADMIN_PASSWORD`는 강력한 비밀번호로 설정하세요
- 프로덕션 환경에서는 반드시 환경 변수로 관리하세요
- `.env.local` 파일은 절대 Git에 커밋하지 마세요 (`.gitignore`에 포함되어 있음)
- 세션 쿠키는 7일간 유지되며, 로그아웃 시 삭제됩니다

### 뉴스 카테고리

- **태국뉴스**: 태국에서 발생한 주요 뉴스
- **관련뉴스**: 한국에서 태국과 관련된 뉴스
- **한국뉴스**: 한국의 주요 뉴스

## 주요 기능

- ✅ Google Gemini API를 통한 뉴스 수집
- ✅ 매일 오전 6시 (태국 시간) 자동 뉴스 수집 (GitHub Actions)
- ✅ Supabase PostgreSQL 데이터베이스를 통한 뉴스 데이터 저장
- ✅ Supabase Storage를 통한 이미지 저장
- ✅ 카테고리별 뉴스 조회 및 표시
- ✅ 무한 스크롤을 통한 효율적인 뉴스 표시
- ✅ 뉴스 검색 기능 (헤더 검색창)
- ✅ 중복 뉴스 방지 로직
- ✅ AWS 스타일의 모던한 UI
- ✅ 태국 뉴스 영어 원문 자동 한국어 번역
- ✅ AI 이미지 생성 및 자동 업로드
- ✅ 에러 핸들링 및 성능 최적화

## 배포

### Supabase 설정

1. [Supabase](https://supabase.com)에서 프로젝트 생성
2. SQL Editor에서 `supabase/schema.sql` 파일의 내용을 실행하여 테이블 생성
3. SQL Editor에서 `supabase/migrations/enable_rls.sql` 파일의 내용을 실행하여 RLS 활성화 (보안 강화)
4. SQL Editor에서 `supabase/migrations/fix_function_search_path.sql` 파일의 내용을 실행하여 함수 보안 설정 (보안 강화)
5. **Storage 설정**:
   - Storage 메뉴로 이동
   - 새 버킷 생성: `news-images`
   - Public 버킷으로 설정 (이미지 공개 접근)
   - RLS 정책 설정: SELECT는 Public, INSERT/UPDATE/DELETE는 Service Role만
6. Project Settings > API에서 다음 값 확인:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

### Vercel 배포

1. GitHub에 코드 푸시
2. [Vercel](https://vercel.com)에서 프로젝트 import
3. 환경 변수 설정:
   - `GOOGLE_GEMINI_API_KEY` (필수)
   - `NEXT_PUBLIC_SUPABASE_URL` (필수)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (필수)
   - `SUPABASE_SERVICE_ROLE_KEY` (필수)
   - `ADMIN_PASSWORD` (관리자 페이지 접속용, 선택사항)
   - `IMAGE_GENERATION_API` (이미지 생성 API 선택, 선택사항)
   - `REPLICATE_API_TOKEN`, `HUGGINGFACE_API_KEY`, `DEEPAI_API_KEY` (이미지 생성 API 토큰, 선택사항)
4. 배포 완료!

### GitHub Actions 설정

뉴스 수집은 GitHub Actions를 통해 자동으로 실행됩니다.

1. **GitHub Secrets 설정**:

   - 저장소 Settings > Secrets and variables > Actions
   - 다음 Secrets 추가:
     - `GOOGLE_GEMINI_API_KEY`
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `IMAGE_GENERATION_API` (선택사항)
     - `REPLICATE_API_TOKEN`, `HUGGINGFACE_API_KEY`, `DEEPAI_API_KEY` (선택사항)
     - `GEMINI_USE_CONTEXT_CACHING`, `GEMINI_NEWS_COLLECTION_MODEL`, `GEMINI_TRANSLATION_MODEL` (선택사항)

2. **워크플로우 확인**:

   - `.github/workflows/fetch-news.yml` 파일이 자동으로 인식됩니다
   - Actions 탭에서 워크플로우 실행 상태 확인 가능
   - 수동 실행: Actions 탭 > Fetch News Daily > Run workflow

3. **스케줄 확인**:
   - 매일 UTC 23시 (태국 시간 오전 6시)에 자동 실행
   - 스케줄 변경: `.github/workflows/fetch-news.yml`의 `cron` 값 수정

## 문서

- [개발 환경 가이드](docs/DEVELOPMENT.md) - Docker 및 Dev Container 사용 방법
- [MCP 서버 설정 가이드](docs/MCP_SETUP.md) - MCP 서버(Supabase, Docker) 설정 방법
- [배포 가이드](DEPLOYMENT.md) - Supabase 및 Vercel 배포 가이드
- [API 문서](docs/API.md) - API 엔드포인트 상세 문서
- [아키텍처 문서](docs/ARCHITECTURE.md) - 시스템 아키텍처 및 데이터 흐름
- [PowerShell 인코딩 가이드](docs/POWERSHELL_ENCODING.md) - Windows PowerShell 한글 인코딩 문제 해결

## 향후 계획

- [x] 뉴스 상세 페이지 ✅ (구현 완료)
- [x] 필터링 (카테고리별) ✅ (구현 완료 - `/category/[category]` 페이지)
- [ ] 필터링 (날짜, 국가별) - 추가 구현 필요
- [ ] Redis를 통한 Rate Limiting 개선

## 라이선스

ISC
