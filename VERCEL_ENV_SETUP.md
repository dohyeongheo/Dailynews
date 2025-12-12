# Vercel 환경 변수 설정 가이드

## Vercel 대시보드에서 환경 변수 설정하기

### 1. Vercel 프로젝트 접속

1. [Vercel 대시보드](https://vercel.com/dashboard)에 로그인
2. 배포하려는 프로젝트 클릭
3. 좌측 메뉴에서 **"Settings"** 클릭
4. **"Environment Variables"** 메뉴 클릭

### 2. 환경 변수 추가

다음 환경 변수들을 하나씩 추가합니다:

#### 필수 환경 변수

1. **GOOGLE_GEMINI_API_KEY**
   - Key: `GOOGLE_GEMINI_API_KEY`
   - Value: Google Gemini API 키 (예: `AIza...`)
   - Environment: `Production`, `Preview`, `Development` 모두 선택

2. **NEXT_PUBLIC_SUPABASE_URL**
   - Key: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: Supabase 프로젝트 URL (예: `https://xxxxx.supabase.co`)
   - Environment: `Production`, `Preview`, `Development` 모두 선택

3. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: Supabase anon public key
   - Environment: `Production`, `Preview`, `Development` 모두 선택

4. **SUPABASE_SERVICE_ROLE_KEY**
   - Key: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: Supabase service_role key (⚠️ 비밀 유지 필요)
   - Environment: `Production`, `Preview`, `Development` 모두 선택

5. **DB_TYPE**
   - Key: `DB_TYPE`
   - Value: `supabase`
   - Environment: `Production`, `Preview`, `Development` 모두 선택

### 3. 환경 변수 추가 방법

각 환경 변수마다:

1. **"Add New"** 또는 **"Add"** 버튼 클릭
2. **Key** 입력란에 변수 이름 입력
3. **Value** 입력란에 변수 값 입력
4. **Environment** 체크박스에서 다음 중 선택:
   - ✅ **Production**: 프로덕션 배포에 사용
   - ✅ **Preview**: 프리뷰 배포에 사용
   - ✅ **Development**: 개발 환경에 사용
5. **"Save"** 버튼 클릭

### 4. 환경 변수 확인

모든 환경 변수가 추가되었는지 확인:

```
✅ GOOGLE_GEMINI_API_KEY
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
✅ DB_TYPE
```

### 5. 재배포

환경 변수를 추가한 후:

1. **"Deployments"** 탭으로 이동
2. 최신 배포 항목의 **"..."** 메뉴 클릭
3. **"Redeploy"** 선택
4. 또는 GitHub에 새로운 커밋을 푸시하면 자동으로 재배포됩니다

## Supabase API 키 확인 방법

### 1. Supabase 프로젝트 접속

1. [Supabase 대시보드](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택

### 2. API 키 확인

1. 좌측 메뉴에서 **"Project Settings"** 클릭
2. **"API"** 섹션 클릭
3. 다음 값들을 확인:

   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`에 사용
   - **anon public** key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`에 사용
   - **service_role** key: `SUPABASE_SERVICE_ROLE_KEY`에 사용 (⚠️ 비밀!)

### 3. Google Gemini API 키 확인

1. [Google AI Studio](https://makersuite.google.com/app/apikey) 접속
2. API 키 생성 또는 기존 키 확인
3. `GOOGLE_GEMINI_API_KEY`에 사용

## 문제 해결

### 환경 변수가 적용되지 않는 경우

1. **재배포 필요**: 환경 변수 추가 후 반드시 재배포해야 합니다
2. **환경 확인**: Production, Preview, Development 중 올바른 환경에 설정되었는지 확인
3. **변수 이름 확인**: 대소문자와 언더스코어가 정확한지 확인

### 빌드 오류가 발생하는 경우

1. **모든 환경 변수 확인**: 위의 5개 변수가 모두 설정되었는지 확인
2. **값 확인**: API 키가 올바른 형식인지 확인 (공백 없이)
3. **빌드 로그 확인**: Vercel 배포 로그에서 구체적인 오류 메시지 확인

### 환경 변수 보안

- ⚠️ **절대 GitHub에 커밋하지 마세요**: `.env` 파일은 `.gitignore`에 포함되어 있습니다
- ⚠️ **Service Role Key 보안**: `SUPABASE_SERVICE_ROLE_KEY`는 절대 공개하지 마세요
- ✅ **Vercel에서만 관리**: 모든 환경 변수는 Vercel 대시보드에서만 관리하세요

## 빠른 체크리스트

배포 전 확인사항:

- [ ] `GOOGLE_GEMINI_API_KEY` 설정됨
- [ ] `NEXT_PUBLIC_SUPABASE_URL` 설정됨
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정됨
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 설정됨
- [ ] `DB_TYPE=supabase` 설정됨
- [ ] 모든 환경 변수가 Production, Preview, Development에 설정됨
- [ ] Supabase 데이터베이스에 테이블이 생성됨 (`supabase/schema.sql` 실행됨)
- [ ] 재배포 완료

## 추가 참고사항

### 환경별 설정

- **Production**: 실제 사용자에게 제공되는 환경
- **Preview**: Pull Request나 브랜치별 배포 환경
- **Development**: 로컬 개발 환경 (Vercel CLI 사용 시)

대부분의 경우 세 환경 모두 동일한 값을 사용하지만, 필요에 따라 다르게 설정할 수 있습니다.

### 환경 변수 우선순위

1. Vercel 대시보드에서 설정한 환경 변수
2. `.env.local` 파일 (로컬 개발 시)
3. `.env` 파일 (로컬 개발 시)

Vercel 배포 시에는 Vercel 대시보드의 환경 변수가 사용됩니다.

