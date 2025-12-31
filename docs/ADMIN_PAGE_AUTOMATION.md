# 관리자 페이지 자동 접속 및 콘솔 에러 확인 기능

AI 에이전트가 관리자 페이지에 자동으로 접속하고 콘솔 에러를 확인할 수 있는 기능입니다.

## 개요

이 기능을 통해 AI 에이전트는 다음을 자동으로 수행할 수 있습니다:

1. Vercel 배포 URL 확인
2. 관리자 로그인 페이지 접속
3. 비밀번호 입력 및 로그인
4. 관리자 페이지 접속
5. 콘솔 에러 확인
6. 에러 분석 및 원인 파악
7. 해결 방안 제시 및 코드 수정

## 구성 요소

### 1. Browser MCP 통합 유틸리티

**파일**: `lib/utils/browser-automation.ts`

Browser MCP 서버를 사용하기 쉬운 래퍼 함수를 제공합니다.

#### 주요 함수

- `accessAdminPage(baseUrl, password)`: 관리자 페이지 자동 접속
- `collectConsoleErrors(filterLevel)`: 콘솔 에러 수집
- `checkPageHealth(url)`: 페이지 상태 확인
- `takeScreenshot()`: 스크린샷 캡처
- `getVercelDeploymentUrl()`: Vercel 배포 URL 조회

### 2. 관리자 페이지 자동 접속 스크립트

**파일**: `scripts/admin/auto-access.ts`

Browser MCP 서버를 사용하여 관리자 페이지에 자동으로 접속하고 콘솔 에러를 확인합니다.

#### 사용법

```bash
npm run admin:auto-access
```

#### 환경 변수

- `ADMIN_PASSWORD`: 관리자 비밀번호 (필수)
- `NEXT_PUBLIC_VERCEL_URL` 또는 `VERCEL_URL`: 배포 URL (선택, 기본값: https://dailynews-rho.vercel.app)
- `CAPTURE_SCREENSHOT`: 스크린샷 캡처 여부 (선택, 기본값: false)

### 3. 콘솔 에러 분석 API

**파일**: `app/api/admin/console-errors/route.ts`

Browser MCP 서버를 통해 수집한 콘솔 에러를 분석합니다.

#### 엔드포인트

- `GET /api/admin/console-errors`: 콘솔 에러 목록 조회
  - Query Parameters:
    - `url`: 확인할 페이지 URL (선택)
    - `level`: 필터링할 로그 레벨 (선택, 기본값: error,warning)
- `POST /api/admin/console-errors`: 콘솔 에러 분석
  - Request Body:
    ```json
    {
      "url": "https://dailynews-rho.vercel.app/admin",
      "messages": [...]
    }
    ```

#### 응답 형식

```json
{
  "success": true,
  "data": {
    "total": 5,
    "errors": 2,
    "warnings": 3,
    "infos": 0,
    "messages": [...],
    "errorLocations": [...],
    "relatedFiles": [...]
  }
}
```

### 4. 관리자 페이지 모니터링 API

**파일**: `app/api/admin/monitor/route.ts`

관리자 페이지 상태를 모니터링합니다.

#### 엔드포인트

- `GET /api/admin/monitor`: 관리자 페이지 상태 모니터링
  - Query Parameters:
    - `url`: 확인할 페이지 URL (선택)
- `POST /api/admin/monitor`: 관리자 페이지 탭별 에러 확인
  - Request Body:
    ```json
    {
      "tabs": ["news", "users", "monitoring", "github", "analytics"]
    }
    ```

#### 응답 형식

```json
{
  "success": true,
  "data": {
    "pageHealth": {...},
    "apiStatuses": [...],
    "metrics": {...},
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 5. 관리자 페이지 에러 모니터링 컴포넌트

**파일**: `components/admin/ErrorMonitor.tsx`

관리자 페이지 내에서 실시간 에러 모니터링을 제공합니다.

#### 기능

- 클라이언트 사이드 콘솔 에러 캡처
- 서버로 에러 전송
- 에러 목록 표시
- Sentry와 통합

#### 사용법

```tsx
<ErrorMonitor autoRefresh={true} refreshInterval={5000} />
```

#### Props

- `autoRefresh`: 자동 새로고침 여부 (기본값: true)
- `refreshInterval`: 새로고침 간격 (밀리초, 기본값: 5000)

### 6. CLI 스크립트

**파일**: `scripts/admin/check-errors.ts`

관리자 페이지 에러 확인 CLI입니다.

#### 사용법

```bash
# 기본 에러 확인
npm run admin:check-errors

# 페이지 상태만 확인
npm run admin:check-errors health

# 도움말
npm run admin:check-errors help
```

#### 명령어

- `check`, `errors`: 관리자 페이지 접속 및 에러 확인 (기본값)
- `health`: 페이지 상태만 확인
- `help`: 도움말 표시

#### 환경 변수

- `ADMIN_PASSWORD`: 관리자 비밀번호 (필수)
- `NEXT_PUBLIC_VERCEL_URL` 또는 `VERCEL_URL`: 배포 URL (선택)

## AI 에이전트 사용 시나리오

### 시나리오 1: 관리자 페이지 콘솔 에러 확인

```
사용자: "관리자 페이지의 콘솔 에러를 확인해줘"

AI 에이전트:
1. npm run admin:check-errors 실행
2. 에러 리포트 분석
3. 에러 원인 파악
4. 해결 방안 제시
```

### 시나리오 2: 자동 접속 및 에러 수집

```
사용자: "관리자 페이지에 접속해서 에러를 확인하고 분석해줘"

AI 에이전트:
1. npm run admin:auto-access 실행
2. 콘솔 에러 수집
3. /api/admin/console-errors API 호출하여 분석
4. 에러 리포트 생성
5. 해결 방안 제시
```

### 시나리오 3: 실시간 모니터링

```
사용자: "관리자 페이지의 실시간 상태를 확인해줘"

AI 에이전트:
1. /api/admin/monitor API 호출
2. 페이지 상태 확인
3. API 엔드포인트 응답 상태 확인
4. 성능 메트릭 수집
5. 결과 리포트 생성
```

## Browser MCP 서버 사용

Browser MCP 서버는 다음 기능을 제공합니다:

- `browser_navigate`: 페이지 탐색
- `browser_snapshot`: 페이지 구조 분석
- `browser_click`: 요소 클릭
- `browser_type`: 텍스트 입력
- `browser_console_messages`: 콘솔 메시지 확인
- `browser_network_requests`: 네트워크 요청 모니터링
- `browser_take_screenshot`: 스크린샷 캡처

### 관리자 로그인 자동화 프로세스

1. Vercel 배포 URL 확인
2. `/admin/login` 페이지 접속
3. 비밀번호 입력 필드 찾기
4. `ADMIN_PASSWORD` 환경 변수에서 비밀번호 읽기
5. 로그인 버튼 클릭
6. 세션 쿠키 저장
7. `/admin` 페이지 접속

### 콘솔 에러 수집 프로세스

1. Browser MCP의 `browser_console_messages` 사용
2. 에러 타입별 분류 (error, warning, info)
3. 스택 트레이스 추출
4. 관련 파일 경로 식별
5. Sentry와 통합하여 이슈 생성

## 보안 고려사항

- 관리자 비밀번호는 환경 변수로만 관리
- 세션 쿠키는 안전하게 저장
- 자동화 스크립트는 로컬에서만 실행
- API 엔드포인트는 관리자 인증 필요

## 문제 해결

### Browser MCP 서버 연결 실패

Browser MCP 서버가 연결되지 않는 경우:

1. MCP 서버 설정 확인 (`~/.cursor/mcp.json`)
2. Browser MCP 서버가 실행 중인지 확인
3. 네트워크 연결 확인

### 관리자 로그인 실패

관리자 로그인이 실패하는 경우:

1. `ADMIN_PASSWORD` 환경 변수 확인
2. 비밀번호가 올바른지 확인
3. 세션 쿠키 설정 확인

### 콘솔 에러 수집 실패

콘솔 에러 수집이 실패하는 경우:

1. Browser MCP 서버 연결 확인
2. 페이지 로드 완료 대기
3. 네트워크 요청 상태 확인

## 참고 자료

- [Browser MCP 서버 문서](https://modelcontextprotocol.io/)
- [Vercel 배포 문서](https://vercel.com/docs)
- [Sentry 에러 추적](https://docs.sentry.io/)




