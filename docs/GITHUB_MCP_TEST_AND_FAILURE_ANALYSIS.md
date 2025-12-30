# GitHub MCP 서버 테스트 및 fetch news daily 실패 원인 분석

분석 일시: 2025-01-29

## 1. GitHub MCP 서버 연결 테스트

### 연결 상태

✅ **성공** - GitHub MCP 서버가 정상적으로 연결되어 있습니다.

### 테스트 결과

#### ✅ 성공한 기능

1. **리포지토리 검색** (`mcp_github_search_repositories`)

   - 리포지토리 검색 성공
   - `dohyeongheo/Dailynews` 리포지토리 확인
   - 리포지토리 정보: Public, 생성일 2025-12-12, 최근 업데이트 2025-12-28

2. **커밋 목록 조회** (`mcp_github_list_commits`)

   - 최근 커밋 목록 조회 성공
   - 최근 10개 커밋 확인
   - 최신 커밋: "feat: 모니터링 시스템 구현 및 Docker 리소스 제한 설정" (2025-12-28)

3. **파일 내용 조회** (`mcp_github_get_file_contents`)

   - 워크플로우 파일 조회 성공
   - `.github/workflows/fetch-news.yml` 파일 내용 확인

4. **이슈 목록 조회** (`mcp_github_list_issues`)
   - 이슈 목록 조회 성공
   - 현재 열린 이슈 없음

### 사용 가능한 주요 작업

- 리포지토리 정보 조회 및 검색
- 커밋 및 브랜치 관리
- 파일 내용 조회 및 수정
- 이슈 및 PR 생성 및 관리
- 코드 검색
- Pull Request 관리
- 릴리즈 관리

### 실제 사용 예제

```typescript
// 리포지토리 검색
"Dailynews 리포지토리를 검색해줘";

// 커밋 목록 조회
"최근 커밋 목록을 보여줘";

// 파일 내용 조회
".github/workflows/fetch-news.yml 파일을 보여줘";

// 이슈 생성
"새 이슈를 생성해줘";
```

### 참고 사항

- GitHub MCP 서버는 GitHub Actions 워크플로우 실행 기록을 직접 조회하는 기능을 제공하지 않습니다.
- 워크플로우 실행 기록은 GitHub 웹 인터페이스 또는 GitHub REST API를 통해 확인해야 합니다.
- 워크플로우 로그는 GitHub Actions 탭에서 직접 확인하거나, 실패 시 업로드된 아티팩트를 다운로드하여 확인할 수 있습니다.

### GitHub REST API 사용

워크플로우 실행 기록 추적 및 프로젝트 관리를 위해서는 GitHub REST API를 직접 사용할 수 있습니다. 자세한 내용은 [GitHub REST API 워크플로우 추적 가이드](./GITHUB_REST_API_WORKFLOW_TRACKING.md)를 참조하세요.

---

## 2. fetch news daily 실패 원인 분석

### 코드 분석 결과

#### 이미지 생성 실패 처리 메커니즘

코드 분석 결과, 이미지 생성 실패는 전체 프로세스를 중단하지 않도록 설계되어 있습니다:

1. **`generateImagesForNews` 함수** (`lib/news-fetcher.ts:854-998`)

   - `Promise.allSettled`를 사용하여 개별 이미지 생성 실패가 전체 배치를 중단하지 않음
   - 각 이미지 생성 실패는 로그에 기록되지만 프로세스는 계속 진행

2. **`saveNewsToDatabase` 함수** (`lib/news-fetcher.ts:1110-1156`)

   - 이미지 생성 실패는 catch 블록에서 처리됨 (1133-1139번 줄)
   - 주석: "이미지 생성 실패는 뉴스 저장 결과에 영향을 주지 않음"

3. **`fetchAndSaveNews` 함수** (`lib/news-fetcher.ts:1163-1219`)
   - 이미지 생성 실패와 무관하게 뉴스 수집 결과를 반환
   - 성공/실패 카운트는 뉴스 저장 결과만 반영

### 이전 실행 로그 분석 (사용자 제공)

```
✅ 성공: 21개
❌ 실패: 0개
📊 전체: 21개
⏱️  실행 시간: 215.11초
```

**발견된 문제**:

- 21개 뉴스 중 1개 이미지 생성 실패
- 실패한 뉴스 ID: `f36cfe87-8eb9-4257-b629-f31f52f606e0`
- 에러: "Gemini API에서 이미지 데이터를 추출할 수 없습니다"
- 하지만 전체 프로세스는 성공으로 표시됨 (뉴스 저장은 성공, 이미지 생성만 실패)

**중요**: 이미지 생성 실패는 뉴스 저장 결과에 영향을 주지 않으므로, 워크플로우가 실패했다면 다른 원인이 있을 수 있습니다.

### 가능한 실패 원인

#### 1. 이미지 생성 실패 (확인됨)

- **원인**: Gemini API 응답에서 이미지 데이터를 추출할 수 없음
- **영향**: 개별 뉴스의 이미지 생성 실패 (전체 프로세스는 계속 진행)
- **해결책**: 이미 개선된 로깅 추가됨 (`lib/image-generator/ai-image-generator.ts`)

#### 2. GitHub Actions 워크플로우 실패 가능성

다음 원인들로 인해 워크플로우 자체가 실패할 수 있습니다:

##### A. 환경 변수 누락

- **확인 방법**: 워크플로우의 "Verify required secrets" 단계 확인
- **필수 환경 변수**:
  - `GOOGLE_GEMINI_API_KEY`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- **해결책**: GitHub Secrets에 모든 필수 변수가 설정되어 있는지 확인

##### B. API 할당량 초과

- **확인 방법**: 로그에서 "quota exceeded" 또는 "429" 에러 확인
- **증상**: Gemini API 호출 실패
- **해결책**:
  - API 할당량 확인
  - 재시도 로직 확인 (최대 3회 재시도)
  - 할당량 초과 시 다음 날까지 대기

##### C. 네트워크 오류

- **확인 방법**: 로그에서 "timeout", "network", "503" 에러 확인
- **증상**: API 호출 타임아웃 또는 연결 실패
- **해결책**: 재시도 로직이 자동으로 처리 (최대 3회)

##### D. 타임아웃

- **확인 방법**: 워크플로우 실행 시간이 60분 초과
- **증상**: GitHub Actions 타임아웃 (60분 제한)
- **해결책**:
  - 이미지 생성 타임아웃 설정 확인
  - 배치 크기 조정

##### E. 스크립트 실행 오류

- **확인 방법**: "Fetch and save news" 단계의 에러 로그 확인
- **증상**: Node.js 스크립트 실행 중 예외 발생
- **해결책**: 에러 로그 확인 및 수정

### 실패 원인 확인 방법

#### 1. GitHub Actions 워크플로우 로그 확인 (권장)

1. GitHub 저장소로 이동: https://github.com/dohyeongheo/Dailynews
2. **Actions** 탭 클릭
3. **"Fetch News Daily"** 워크플로우 선택
4. 최근 실행 기록 확인
5. 실패한 실행 클릭하여 상세 로그 확인
6. 각 단계별 로그 확인:
   - "Verify required secrets" 단계
   - "Fetch and save news" 단계
   - "Upload logs on failure" 단계 (실패 시)

#### 2. 에러 아티팩트 확인

실패한 워크플로우 실행에서:

1. "Upload logs on failure" 단계 확인
2. "error-logs" 아티팩트 다운로드
3. 로그 파일에서 상세 에러 확인

#### 2. 주요 확인 사항

- **환경 변수 확인**: "Verify required secrets" 단계 성공 여부
- **스크립트 실행**: "Fetch and save news" 단계의 에러 메시지
- **실행 시간**: 타임아웃 발생 여부
- **에러 아티팩트**: "Upload logs on failure" 단계에서 생성된 로그 파일

#### 3. 로그에서 확인할 키워드

```
❌ Error:                    # 일반 오류
quota exceeded               # 할당량 초과
429                          # 할당량 초과 HTTP 상태 코드
timeout                      # 타임아웃
network                      # 네트워크 오류
503                          # 서비스 사용 불가
필수 환경 변수가 설정되지 않음  # 환경 변수 누락
```

### 해결 방안

#### 즉시 조치 사항

1. **GitHub Actions 로그 확인**

   - 실패한 워크플로우 실행의 상세 로그 확인
   - 에러 메시지 및 스택 트레이스 분석

2. **환경 변수 확인**

   - GitHub Secrets에 모든 필수 변수가 설정되어 있는지 확인
   - 변수 이름 오타 확인

3. **이미지 생성 실패 처리 개선**
   - 이미 개선된 로깅으로 상세한 디버깅 정보 제공
   - 다음 실행 시 실패 원인을 더 정확히 파악 가능

#### 장기 개선 사항

1. **에러 알림 설정**

   - GitHub Actions 실패 시 알림 설정
   - 이메일 또는 Slack 알림

2. **모니터링 강화**

   - Sentry를 통한 에러 추적
   - 메트릭 대시보드 구축

3. **재시도 로직 개선**

   - 이미지 생성 실패 시 자동 재시도
   - 지수 백오프 적용

4. **타임아웃 관리**
   - 이미지 생성 타임아웃 최적화
   - 워크플로우 타임아웃 설정 조정

### 코드 개선 사항 (이미 적용됨)

#### 이미지 생성 실패 디버깅 개선

`lib/image-generator/ai-image-generator.ts`에 다음 개선사항이 추가되었습니다:

1. **상세한 응답 구조 로깅**

   - `candidateStructure`: 실제 응답 구조 분석
   - `finishReason`, `finishMessage`: 실패 원인 파악
   - `safetyRatings`: 콘텐츠 정책 위반 확인
   - `fullCandidate`: 전체 응답 JSON (최대 2000자)

2. **finishReason 확인**
   - `STOP`이 아닌 경우 경고 로그 출력
   - 실패 원인 파악에 도움

### 다음 단계

1. **GitHub Actions 로그 확인**

   - 오늘 실행된 워크플로우의 상세 로그 확인
   - 실패 원인 정확히 파악

2. **GitHub MCP 서버 설정** (선택사항)

   - GitHub MCP 서버 설정하여 워크플로우 로그 자동 조회 가능
   - 향후 실패 원인 분석 자동화

3. **모니터링 설정**
   - Sentry를 통한 에러 추적
   - 실패 시 자동 알림

---

## 참고 자료

- [GitHub Actions 워크플로우 파일](.github/workflows/fetch-news.yml)
- [뉴스 수집 스크립트](scripts/fetch-news.ts)
- [이미지 생성 코드](lib/image-generator/ai-image-generator.ts)
- [MCP 서버 테스트 결과](./MCP_SERVERS_TEST_RESULTS.md)
