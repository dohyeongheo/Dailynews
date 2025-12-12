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

### 1.3 API 키 확인

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

Vercel 프로젝트 설정에서 "Environment Variables" 섹션으로 이동하여 다음 변수들을 추가:

```
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DB_TYPE=supabase
```

**중요**:
- Production, Preview, Development 환경 모두에 설정
- `SUPABASE_SERVICE_ROLE_KEY`는 절대 공개하지 마세요

**자세한 설정 방법**: `VERCEL_ENV_SETUP.md` 파일을 참고하세요.

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

