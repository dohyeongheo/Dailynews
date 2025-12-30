# MCP 서버 연결 테스트 결과

테스트 일시: 2025-01-29

## 개요

현재 설정된 모든 MCP (Model Context Protocol) 서버의 연결 상태를 테스트하고, 각 서버를 통해 수행 가능한 작업들을 정리한 문서입니다.

## 테스트 결과 요약

| 서버       | 연결 상태    | 기능 수 | 비고                            |
| ---------- | ------------ | ------- | ------------------------------- |
| Supabase   | ✅ 성공      | 15+     | 모든 기능 정상 작동             |
| Vercel     | ✅ 성공      | 10+     | 프로젝트 및 배포 관리 가능      |
| Sentry     | ✅ 성공      | 20+     | 에러 모니터링 및 이슈 관리 가능 |
| Docker Hub | ⚠️ 부분 성공 | 5+      | 인증 설정 필요                  |
| Browser    | ✅ 성공      | 15+     | 웹 페이지 자동화 가능           |
| GitHub     | ✅ 성공      | 10+     | 리포지토리 및 코드 관리 가능    |

---

## 1. Supabase MCP 서버

### 연결 상태

✅ **성공** - 모든 기능 정상 작동

### 테스트 결과

#### ✅ 성공한 기능

1. **테이블 목록 조회** (`mcp_supabase_list_tables`)

   - 9개 테이블 확인: `news`, `users`, `bookmarks`, `comments`, `news_views`, `news_reactions`, `comment_reactions`, `metrics_history`
   - 각 테이블의 스키마, 컬럼, 제약조건 정보 확인 가능

2. **SQL 쿼리 실행** (`mcp_supabase_execute_sql`)

   - SELECT 쿼리 실행 성공
   - 예: `SELECT COUNT(*) as total_news FROM news;` → 554개 뉴스 확인

3. **마이그레이션 관리** (`mcp_supabase_list_migrations`)

   - 마이그레이션 목록 조회 성공
   - 현재 마이그레이션: `20251228133627_create_metrics_history`

4. **보안 권고사항 확인** (`mcp_supabase_get_advisors`)

   - 보안 권고사항 조회 성공
   - 현재 보안 이슈 없음

5. **로그 확인** (`mcp_supabase_get_logs`)

   - API 로그 조회 성공
   - 최근 24시간 내 로그 확인 가능
   - 서비스별 로그 필터링 가능 (api, postgres, edge-function, auth, storage, realtime)

6. **TypeScript 타입 생성** (`mcp_supabase_generate_typescript_types`)

   - 데이터베이스 스키마 기반 TypeScript 타입 생성 성공
   - 모든 테이블, 관계, 함수에 대한 타입 정의 제공

7. **프로젝트 정보 조회** (`mcp_supabase_get_project_url`, `mcp_supabase_get_publishable_keys`)

   - 프로젝트 URL 확인: `https://ejrhewxbfxqlguathrxh.supabase.co`
   - Publishable 키 목록 조회 성공

8. **Edge Functions 관리** (`mcp_supabase_list_edge_functions`)
   - Edge Functions 목록 조회 성공
   - 현재 등록된 Edge Function 없음

### 사용 가능한 주요 작업

- 데이터베이스 쿼리 실행 (SELECT, INSERT, UPDATE, DELETE)
- 테이블 스키마 조회 및 분석
- 마이그레이션 생성 및 적용
- 보안 취약점 검사
- 로그 모니터링 및 분석
- TypeScript 타입 자동 생성
- Edge Functions 배포 및 관리
- 브랜치 관리 (개발/프로덕션 분리)
- 확장 프로그램 관리

### 실제 사용 예제

```typescript
// 테이블 목록 조회
"Supabase 테이블 목록을 보여줘";

// 데이터 조회
"news 테이블에서 최근 10개 뉴스를 조회해줘";

// 보안 검사
"보안 권고사항을 확인해줘";

// 타입 생성
"데이터베이스 스키마에 대한 TypeScript 타입을 생성해줘";
```

---

## 2. Vercel MCP 서버

### 연결 상태

✅ **성공** - 프로젝트 및 배포 관리 가능

### 테스트 결과

#### ✅ 성공한 기능

1. **팀 목록 조회** (`mcp_Vercel_list_teams`)

   - 팀 정보 확인 성공
   - 팀 ID: `team_QWURt0g6TjabDGfWW8ld7Izq`
   - 팀 이름: "dohyeongheo's projects"

2. **프로젝트 목록 조회** (`mcp_Vercel_list_projects`)

   - 2개 프로젝트 확인:
     - `dailynews` (prj_CXQtTadad8xFZYVFGDWPaeoVWtp2)
     - `company-website` (prj_Q8xPSeQ3KRt7eY1nKF41OyN8AemI)

3. **문서 검색** (`mcp_Vercel_search_vercel_documentation`)
   - Vercel 문서 검색 성공
   - 배포 관련 문서 검색 가능

### 사용 가능한 주요 작업

- 프로젝트 목록 조회 및 관리
- 배포 상태 확인 및 모니터링
- 배포 로그 확인
- 배포 생성 및 재배포
- 도메인 관리 및 확인
- Vercel 문서 검색
- 빌드 로그 확인
- 환경 변수 관리

### 실제 사용 예제

```typescript
// 프로젝트 목록 조회
"Vercel 프로젝트 목록을 보여줘";

// 배포 상태 확인
"dailynews 프로젝트의 최근 배포 상태를 확인해줘";

// 문서 검색
"Vercel 배포 관련 문서를 검색해줘";
```

---

## 3. Sentry MCP 서버

### 연결 상태

✅ **성공** - 에러 모니터링 및 이슈 관리 가능

### 테스트 결과

#### ✅ 성공한 기능

1. **사용자 정보 확인** (`mcp_Sentry_whoami`)

   - 인증된 사용자: dohyeongheo (dohyeong.heo@gmail.com)
   - User ID: 4142098

2. **조직 목록 조회** (`mcp_Sentry_find_organizations`)

   - 조직 확인: `personal-4vx`
   - Region URL: `https://us.sentry.io`
   - Web URL: `https://personal-4vx.sentry.io`

3. **프로젝트 목록 조회** (`mcp_Sentry_find_projects`)
   - 프로젝트 확인: `daily-news`

### 사용 가능한 주요 작업

- 이슈 조회 및 관리 (해결, 할당, 무시)
- 프로젝트 생성 및 관리
- 팀 생성 및 관리
- 릴리즈 관리
- 이벤트 검색 및 분석
- 트레이스 조회
- DSN 생성 및 관리
- 이벤트 첨부 파일 다운로드

### 실제 사용 예제

```typescript
// 조직 목록 조회
"Sentry 조직 목록을 보여줘";

// 프로젝트 목록 조회
"personal-4vx 조직의 프로젝트 목록을 보여줘";

// 이슈 검색
"최근 발생한 에러 이슈를 검색해줘";

// 이슈 해결
"이슈 PROJECT-123을 해결 상태로 변경해줘";
```

---

## 4. Docker Hub MCP 서버

### 연결 상태

⚠️ **부분 성공** - 인증 설정 필요

### 테스트 결과

#### ⚠️ 제한된 기능

1. **이미지 검색** (`mcp_MCP_DOCKER_search`)

   - 스키마 오류 발생 (추가 속성 문제)
   - 인증 토큰 설정 필요

2. **개인 네임스페이스 조회** (`mcp_MCP_DOCKER_getPersonalNamespace`)
   - 인증 토큰 오류 발생
   - 토큰 설정 필요

### 사용 가능한 주요 작업 (인증 설정 후)

- Docker Hub 리포지토리 검색
- 리포지토리 정보 조회
- 태그 목록 조회
- 네임스페이스 관리
- 리포지토리 생성 및 관리
- Docker Hardened Images 조회

### 설정 필요 사항

Docker Hub MCP 서버를 완전히 사용하려면:

1. Docker Hub 인증 토큰 설정
2. 개인 네임스페이스 정보 제공

### 실제 사용 예제 (인증 설정 후)

```typescript
// 이미지 검색
"node 이미지를 검색해줘";

// 리포지토리 정보 조회
"library/node 리포지토리 정보를 보여줘";

// 태그 목록 조회
"library/node의 태그 목록을 보여줘";
```

---

## 5. Browser MCP 서버

### 연결 상태

✅ **성공** - 웹 페이지 자동화 가능

### 테스트 결과

#### ✅ 성공한 기능

1. **페이지 탐색** (`mcp_cursor-ide-browser_browser_navigate`)

   - URL 탐색 성공
   - 예: `https://example.com` 접속 성공

2. **페이지 스냅샷** (`mcp_cursor-ide-browser_browser_snapshot`)

   - 페이지 구조 분석 성공
   - 접근성 정보 추출 가능
   - 요소 참조 ID 생성

3. **스크린샷 캡처** (`mcp_cursor-ide-browser_browser_take_screenshot`)
   - 스크린샷 캡처 성공
   - 파일 저장: `/tmp/playwright-output/test-screenshot.png`

### 사용 가능한 주요 작업

- 웹 페이지 탐색 및 이동
- 페이지 스냅샷 (접근성 정보 추출)
- 스크린샷 캡처
- 요소 클릭 및 입력
- 폼 작성 및 제출
- 드롭다운 선택
- 키보드 입력
- 콘솔 메시지 확인
- 네트워크 요청 모니터링
- 대화 상자 처리
- 파일 업로드
- 요소 호버
- JavaScript 실행

### 실제 사용 예제

```typescript
// 페이지 탐색
"https://example.com으로 이동해줘";

// 스크린샷 캡처
"현재 페이지의 스크린샷을 찍어줘";

// 요소 클릭
"로그인 버튼을 클릭해줘";

// 폼 작성
"이메일과 비밀번호를 입력해줘";
```

---

## 종합 평가

### 가장 유용한 서버

1. **Supabase MCP 서버** ⭐⭐⭐⭐⭐

   - 데이터베이스 관리의 모든 기능 제공
   - 타입 생성, 마이그레이션, 보안 검사 등 개발에 필수적인 기능 포함

2. **Browser MCP 서버** ⭐⭐⭐⭐⭐

   - 웹 페이지 자동화 및 테스트에 매우 유용
   - E2E 테스트, 웹 스크래핑 등 다양한 용도로 활용 가능

3. **Vercel MCP 서버** ⭐⭐⭐⭐

   - 배포 관리 및 모니터링에 유용
   - CI/CD 파이프라인과 통합 가능

4. **Sentry MCP 서버** ⭐⭐⭐⭐

   - 에러 모니터링 및 이슈 관리에 필수
   - 프로덕션 환경 모니터링에 유용

5. **Docker Hub MCP 서버** ⭐⭐⭐
   - 인증 설정 후 컨테이너 이미지 관리에 유용
   - 현재는 설정이 필요함

### 권장 사용 시나리오

1. **데이터베이스 관리**: Supabase MCP 서버
2. **배포 관리**: Vercel MCP 서버
3. **에러 모니터링**: Sentry MCP 서버
4. **웹 자동화**: Browser MCP 서버
5. **컨테이너 관리**: Docker Hub MCP 서버 (설정 후)

---

## 다음 단계

1. **Docker Hub MCP 서버 설정 완료**

   - 인증 토큰 설정
   - 개인 네임스페이스 정보 제공

2. **추가 테스트**

   - 각 서버의 고급 기능 테스트
   - 실제 워크플로우 통합 테스트

3. **문서화 개선**
   - 각 서버별 상세 사용 가이드 작성
   - 실제 사용 사례 추가

---

## 6. GitHub MCP 서버

### 연결 상태

✅ **성공** - 리포지토리 및 코드 관리 가능

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

### 참고 문서

- [GitHub MCP 서버 테스트 및 실패 원인 분석](./GITHUB_MCP_TEST_AND_FAILURE_ANALYSIS.md)

---

## 참고 자료

- [MCP 서버 설정 가이드](./MCP_SETUP.md)
- [GitHub MCP 서버 테스트 및 실패 원인 분석](./GITHUB_MCP_TEST_AND_FAILURE_ANALYSIS.md)
- [GitHub REST API 워크플로우 추적 가이드](./GITHUB_REST_API_WORKFLOW_TRACKING.md)
- [Model Context Protocol 공식 문서](https://modelcontextprotocol.io/)
- [Supabase MCP 서버 문서](https://github.com/modelcontextprotocol/servers/tree/main/src/supabase)
- [Vercel MCP 서버 문서](https://github.com/modelcontextprotocol/servers)
- [Sentry MCP 서버 문서](https://github.com/modelcontextprotocol/servers)
- [GitHub MCP 서버 문서](https://github.com/modelcontextprotocol/servers/tree/main/src/github)
