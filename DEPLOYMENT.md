# 배포 가이드

## 1. Supabase 데이터베이스 설정

### 1.1 Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 로그인
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - Name: `daily-news` (원하는 이름)
   - Database Password: 안전한 비밀번호 설정
   - Region: 가장 가까운 지역 선택
4. 프로젝트 생성 완료 대기 (약 2분)

### 1.2 데이터베이스 스키마 생성

1. Supabase 대시보드에서 "SQL Editor" 메뉴 클릭
2. "New query" 클릭
3. `supabase/schema.sql` 파일의 내용을 복사하여 붙여넣기
4. "Run" 버튼 클릭하여 실행
5. 테이블 생성 확인

### 1.3 RLS (Row Level Security) 활성화

보안을 위해 RLS를 활성화해야 합니다:

1. Supabase 대시보드에서 "SQL Editor" 메뉴 클릭
2. "New query" 클릭
3. `supabase/migrations/enable_rls.sql` 파일의 내용을 복사하여 붙여넣기
4. "Run" 버튼 클릭하여 실행
5. RLS 활성화 확인

**참고**: 이 애플리케이션은 서버 사이드에서 Service Role Key를 사용하므로, RLS를 활성화해도 서버 사이드 로직에는 영향이 없습니다. RLS는 anon key로의 직접 접근을 차단하여 보안을 강화합니다.

### 1.4 API 키 확인

1. Supabase 대시보드에서 "Project Settings" > "API" 메뉴 클릭
2. 다음 값들을 복사하여 저장:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ 비밀 유지 필요)

## 2. GitHub 저장소 생성 및 연결

### 2.1 GitHub 저장소 생성

1. [GitHub](https://github.com)에 로그인
2. 우측 상단 "+" 버튼 > "New repository" 클릭
3. 저장소 정보 입력:
   - Repository name: `daily-news` (원하는 이름)
   - Description: "Daily News - 태국 및 한국 뉴스 요약 서비스"
   - Public 또는 Private 선택
   - **"Initialize this repository with a README" 체크 해제** (이미 커밋이 있으므로)
4. "Create repository" 클릭

### 2.2 로컬 저장소와 GitHub 연결

터미널에서 다음 명령어 실행:

```bash
# GitHub 저장소 URL로 변경 (예: https://github.com/your-username/daily-news.git)
git remote add origin https://github.com/your-username/daily-news.git
git branch -M main
git push -u origin main
```

**참고**: `your-username`을 본인의 GitHub 사용자명으로 변경하세요.

## 3. Vercel 배포

### 3.1 Vercel 프로젝트 생성

1. [Vercel](https://vercel.com)에 로그인 (GitHub 계정으로 로그인 권장)
2. "Add New..." > "Project" 클릭
3. 방금 생성한 GitHub 저장소 선택
4. "Import" 클릭

### 3.2 환경 변수 설정

Vercel 대시보드에서 환경 변수를 설정합니다:

1. **Settings** > **Environment Variables** 메뉴 클릭
2. **"Add New"** 또는 **"Add"** 버튼 클릭하여 다음 환경 변수들을 하나씩 추가:

#### 필수 환경 변수

- **GOOGLE_GEMINI_API_KEY**
  - Key: `GOOGLE_GEMINI_API_KEY`
  - Value: Google Gemini API 키 (예: `AIza...`)
  - Environment: `Production`, `Preview`, `Development` 모두 선택

- **NEXT_PUBLIC_SUPABASE_URL**
  - Key: `NEXT_PUBLIC_SUPABASE_URL`
  - Value: Supabase 프로젝트 URL (예: `https://xxxxx.supabase.co`)
  - Environment: `Production`, `Preview`, `Development` 모두 선택

- **NEXT_PUBLIC_SUPABASE_ANON_KEY**
  - Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Value: Supabase anon public key
  - Environment: `Production`, `Preview`, `Development` 모두 선택

- **SUPABASE_SERVICE_ROLE_KEY**
  - Key: `SUPABASE_SERVICE_ROLE_KEY`
  - Value: Supabase service_role key (⚠️ 비밀 유지 필요)
  - Environment: `Production`, `Preview`, `Development` 모두 선택

- **BLOB_READ_WRITE_TOKEN**
  - Key: `BLOB_READ_WRITE_TOKEN`
  - Value: Vercel Blob Storage 토큰
  - Environment: `Production`, `Preview`, `Development` 모두 선택

#### 선택적 환경 변수

- **ADMIN_PASSWORD**: 관리자 페이지 접속용 비밀번호
- **MANUAL_FETCH_PASSWORD**: 수동 뉴스 수집용 비밀번호
- **CRON_SECRET**: Cron Job 인증용 Secret
- **IMAGE_GENERATION_API**: 이미지 생성 API 선택 (`gemini`, `replicate`, `huggingface`, `deepai`, `none`)
- **REPLICATE_API_TOKEN**: Replicate API 토큰 (IMAGE_GENERATION_API가 `replicate`인 경우)
- **HUGGINGFACE_API_KEY**: Hugging Face API 키 (IMAGE_GENERATION_API가 `huggingface`인 경우)
- **DEEPAI_API_KEY**: DeepAI API 키 (IMAGE_GENERATION_API가 `deepai`인 경우)
- **GEMINI_USE_CONTEXT_CACHING**: Gemini Context Caching 사용 여부 (`true` 또는 `false`, 기본값: `true`)
- **GEMINI_NEWS_COLLECTION_MODEL**: 뉴스 수집 모델 (`flash` 또는 `pro`, 기본값: `pro`)
- **GEMINI_TRANSLATION_MODEL**: 번역 모델 (`flash` 또는 `pro`, 기본값: `flash`)

3. 각 환경 변수마다 **Environment** 체크박스에서 다음 중 선택:
   - Production: 프로덕션 배포에 사용
   - Preview: 프리뷰 배포에 사용
   - Development: 개발 환경에 사용
   - 일반적으로 모든 환경에 동일하게 설정하는 것을 권장

#### Supabase API 키 확인 방법

1. Supabase 프로젝트 접속
2. **Project Settings** > **API** 메뉴 클릭
3. 다음 값들을 복사:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ 비밀 유지)

#### Google Gemini API 키 확인 방법

1. [Google AI Studio](https://makersuite.google.com/app/apikey) 접속
2. API 키 생성 또는 기존 키 확인
3. 생성된 키를 `GOOGLE_GEMINI_API_KEY`로 설정

### 3.3 배포 실행

1. "Deploy" 버튼 클릭
2. 빌드 완료 대기 (약 2-3분)
3. 배포 완료 후 제공되는 URL로 접속하여 확인

## 4. 배포 후 확인 사항

### 4.1 데이터베이스 연결 확인

1. 배포된 사이트 접속
2. "뉴스 수집" 버튼 클릭
3. Supabase 대시보드 > "Table Editor" > "news" 테이블에서 데이터 확인

### 4.2 자동 배포 설정

- GitHub에 코드를 푸시하면 자동으로 Vercel에서 재배포됩니다
- `main` 브랜치에 푸시하면 Production 환경에 배포
- 다른 브랜치에 푸시하면 Preview 환경에 배포

## 5. 문제 해결

### 데이터베이스 연결 오류

- Supabase 환경 변수가 올바르게 설정되었는지 확인
- `DB_TYPE=supabase`가 설정되었는지 확인
- Supabase 프로젝트가 활성화되어 있는지 확인

### 빌드 오류

- Vercel 빌드 로그 확인
- 환경 변수가 모두 설정되었는지 확인
- `package.json`의 의존성이 올바른지 확인

### 뉴스 수집 오류

- `GOOGLE_GEMINI_API_KEY`가 올바르게 설정되었는지 확인
- API 키의 할당량이 초과되지 않았는지 확인

