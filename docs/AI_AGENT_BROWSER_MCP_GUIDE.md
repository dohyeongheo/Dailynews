# AI 에이전트 Browser MCP 사용 가이드

AI 에이전트가 Browser MCP 툴을 직접 사용하여 관리자 페이지에 접속하고 콘솔 에러를 확인하는 방법을 안내합니다.

## 개요

이 가이드는 AI 에이전트가 Browser MCP 툴을 사용하여 다음을 자동으로 수행하는 방법을 설명합니다:

1. 관리자 로그인 페이지 접속
2. 비밀번호 입력 및 로그인
3. 관리자 페이지 접속
4. 콘솔 에러 확인 및 수집
5. 에러 원인 분석
6. 해결 방안 제시 및 코드 수정

## Browser MCP 툴 목록

### 1. 페이지 탐색

**툴**: `mcp_cursor-ide-browser_browser_navigate`

**설명**: 웹 페이지로 이동합니다.

**파라미터**:
- `url` (string, 필수): 이동할 페이지의 URL

**예제**:
```typescript
mcp_cursor-ide-browser_browser_navigate({
  url: "http://localhost:3000/admin/login"
})
```

### 2. 페이지 구조 분석

**툴**: `mcp_cursor-ide-browser_browser_snapshot`

**설명**: 현재 페이지의 접근성 스냅샷을 캡처하여 페이지 구조를 분석합니다.

**파라미터**: 없음

**예제**:
```typescript
mcp_cursor-ide-browser_browser_snapshot()
```

**반환값**: 페이지의 모든 요소에 대한 접근성 정보와 참조 ID(ref)를 포함한 스냅샷

### 3. 요소 클릭

**툴**: `mcp_cursor-ide-browser_browser_click`

**설명**: 페이지의 요소를 클릭합니다.

**파라미터**:
- `element` (string, 필수): 클릭할 요소의 설명 (예: "로그인 버튼")
- `ref` (string, 필수): `browser_snapshot`에서 얻은 요소 참조 ID

**예제**:
```typescript
mcp_cursor-ide-browser_browser_click({
  element: "로그인 버튼",
  ref: "button-123"
})
```

### 4. 텍스트 입력

**툴**: `mcp_cursor-ide-browser_browser_type`

**설명**: 입력 필드에 텍스트를 입력합니다.

**파라미터**:
- `element` (string, 필수): 입력할 요소의 설명 (예: "비밀번호 입력 필드")
- `ref` (string, 필수): `browser_snapshot`에서 얻은 요소 참조 ID
- `text` (string, 필수): 입력할 텍스트
- `submit` (boolean, 선택): 입력 후 Enter 키를 누를지 여부

**예제**:
```typescript
mcp_cursor-ide-browser_browser_type({
  element: "비밀번호 입력 필드",
  ref: "input-456",
  text: "password123"
})
```

### 5. 콘솔 메시지 확인

**툴**: `mcp_cursor-ide-browser_browser_console_messages`

**설명**: 브라우저 콘솔의 메시지를 가져옵니다.

**파라미터**: 없음

**예제**:
```typescript
mcp_cursor-ide-browser_browser_console_messages()
```

**반환값**: 콘솔 메시지 배열 (level, text, type 등 포함)

### 6. 네트워크 요청 확인

**툴**: `mcp_cursor-ide-browser_browser_network_requests`

**설명**: 페이지의 네트워크 요청 목록을 가져옵니다.

**파라미터**: 없음

**예제**:
```typescript
mcp_cursor-ide-browser_browser_network_requests()
```

**반환값**: 네트워크 요청 배열 (url, status, method 등 포함)

### 7. 스크린샷 캡처

**툴**: `mcp_cursor-ide-browser_browser_take_screenshot`

**설명**: 현재 페이지의 스크린샷을 캡처합니다.

**파라미터**:
- `filename` (string, 선택): 저장할 파일명
- `fullPage` (boolean, 선택): 전체 페이지 스크린샷 여부

**예제**:
```typescript
mcp_cursor-ide-browser_browser_take_screenshot({
  filename: "admin-page.png"
})
```

### 8. 대기

**툴**: `mcp_cursor-ide-browser_browser_wait_for`

**설명**: 특정 조건이 만족될 때까지 대기합니다.

**파라미터**:
- `text` (string, 선택): 대기할 텍스트가 나타날 때까지 대기
- `textGone` (string, 선택): 대기할 텍스트가 사라질 때까지 대기
- `time` (number, 선택): 대기할 시간 (초)

**예제**:
```typescript
mcp_cursor-ide-browser_browser_wait_for({
  text: "관리자 대시보드"
})
```

## 관리자 페이지 접속 워크플로우

### 단계별 가이드

#### 1단계: 관리자 로그인 페이지로 이동

```typescript
mcp_cursor-ide-browser_browser_navigate({
  url: "http://localhost:3000/admin/login"
})
```

**예상 결과**: 로그인 페이지가 로드됨

#### 2단계: 페이지 구조 분석

```typescript
const snapshot = await mcp_cursor-ide-browser_browser_snapshot()
```

**예상 결과**: 비밀번호 입력 필드와 로그인 버튼의 ref ID를 얻음

**중요**: 스냅샷 결과에서 다음 요소를 찾아야 합니다:
- 비밀번호 입력 필드: `input[type="password"]` 또는 "비밀번호" 텍스트가 있는 input
- 로그인 버튼: `button[type="submit"]` 또는 "로그인" 텍스트가 있는 button

**스냅샷 결과 예제**:
```json
{
  "elements": [
    {
      "ref": "input-123",
      "role": "textbox",
      "name": "비밀번호",
      "type": "password"
    },
    {
      "ref": "button-456",
      "role": "button",
      "name": "로그인",
      "type": "submit"
    }
  ]
}
```

#### 3단계: 비밀번호 입력

```typescript
mcp_cursor-ide-browser_browser_type({
  element: "비밀번호 입력 필드",
  ref: "input-123", // 2단계에서 얻은 실제 ref
  text: process.env.ADMIN_PASSWORD // 환경 변수에서 읽기
})
```

**예상 결과**: 비밀번호가 입력됨

#### 4단계: 로그인 버튼 클릭

```typescript
mcp_cursor-ide-browser_browser_click({
  element: "로그인 버튼",
  ref: "button-456" // 2단계에서 얻은 실제 ref
})
```

**예상 결과**: 로그인 요청이 제출되고 리다이렉트됨

#### 5단계: 관리자 페이지 로드 대기

```typescript
mcp_cursor-ide-browser_browser_wait_for({
  text: "관리자 대시보드"
})
```

**예상 결과**: 관리자 페이지가 로드됨

#### 6단계: 관리자 페이지로 이동 (리다이렉트가 안 된 경우)

```typescript
mcp_cursor-ide-browser_browser_navigate({
  url: "http://localhost:3000/admin"
})
```

**예상 결과**: 관리자 대시보드가 표시됨

#### 7단계: 콘솔 메시지 확인

```typescript
const consoleMessages = await mcp_cursor-ide-browser_browser_console_messages()
```

**예상 결과**: 콘솔 에러, 경고, 정보 메시지 목록을 얻음

**콘솔 메시지 형식**:
```json
[
  {
    "level": "error",
    "text": "Failed to fetch: http://localhost:3000/api/admin/metrics",
    "type": "error"
  },
  {
    "level": "warning",
    "text": "페이지뷰 추적 실패 (네트워크 오류)",
    "type": "warning"
  }
]
```

#### 8단계: 네트워크 요청 확인 (선택사항)

```typescript
const networkRequests = await mcp_cursor-ide-browser_browser_network_requests()
```

**예상 결과**: 실패한 네트워크 요청 목록을 얻음

## 에러 분석 및 해결 프로세스

### 1. 에러 수집

Browser MCP로 콘솔 메시지를 수집한 후, `analyzeConsoleErrors()` 함수를 사용하여 에러를 분석합니다.

```typescript
import { analyzeConsoleErrors } from '@/lib/utils/browser-mcp-direct';

const analysis = analyzeConsoleErrors(consoleMessages);
```

**반환값**:
- `errors`: 에러 메시지 배열
- `warnings`: 경고 메시지 배열
- `infos`: 정보 메시지 배열
- `analysis`: 에러 분석 결과 (에러 타입, 해결 방안 등)

### 2. 상세 에러 분석

`generateDetailedErrorReport()` 함수를 사용하여 상세 리포트를 생성합니다.

```typescript
import { generateDetailedErrorReport } from '@/lib/utils/error-analyzer';

const report = generateDetailedErrorReport(errors, warnings);
```

**반환값**:
- `summary`: 요약 통계
- `errorAnalyses`: 각 에러에 대한 상세 분석
- `recommendations`: 권장사항
- `nextSteps`: 다음 단계

### 3. 에러 패턴 매칭

에러 분석 시스템은 다음 패턴을 자동으로 인식합니다:

- **Network Error**: `Failed to fetch`, `NetworkError`
- **Null/Undefined Reference**: `Cannot read property`, `TypeError`
- **Undefined Variable**: `is not defined`, `ReferenceError`
- **Syntax Error**: `Unexpected token`, `SyntaxError`
- **Client Blocking**: `ERR_BLOCKED_BY_CLIENT`
- **Resource Not Found**: `404`, `Not Found`
- **Authentication Error**: `401`, `Unauthorized`
- **Authorization Error**: `403`, `Forbidden`
- **Server Error**: `500`, `Internal Server Error`
- **CORS Error**: `CORS`, `Cross-Origin`
- **Hydration Error**: `Hydration`, `hydration failed`
- **Infinite Loop**: `Maximum update depth exceeded`
- **Module Error**: `Module not found`

### 4. 해결 방안 제시

각 에러 패턴에 대해 구체적인 해결 방안이 제시됩니다:

- **Network Error**: API 엔드포인트 확인, CORS 설정 확인
- **Null/Undefined Reference**: 옵셔널 체이닝 사용, 기본값 설정
- **Undefined Variable**: import 문 확인, 변수 선언 확인
- **Syntax Error**: 코드 문법 확인, TypeScript 타입 오류 확인
- 등등...

## 실제 사용 예제

### 예제 1: 관리자 페이지 접속 및 에러 확인

```typescript
// 1. 로그인 페이지 접속
await mcp_cursor-ide-browser_browser_navigate({
  url: "http://localhost:3000/admin/login"
});

// 2. 페이지 구조 분석
const snapshot = await mcp_cursor-ide-browser_browser_snapshot();
const passwordInput = snapshot.elements.find(e => e.type === 'password');
const loginButton = snapshot.elements.find(e => e.name === '로그인');

// 3. 비밀번호 입력
await mcp_cursor-ide-browser_browser_type({
  element: "비밀번호 입력 필드",
  ref: passwordInput.ref,
  text: process.env.ADMIN_PASSWORD
});

// 4. 로그인 버튼 클릭
await mcp_cursor-ide-browser_browser_click({
  element: "로그인 버튼",
  ref: loginButton.ref
});

// 5. 관리자 페이지 로드 대기
await mcp_cursor-ide-browser_browser_wait_for({
  text: "관리자 대시보드"
});

// 6. 콘솔 메시지 확인
const consoleMessages = await mcp_cursor-ide-browser_browser_console_messages();

// 7. 에러 분석
import { analyzeConsoleErrors } from '@/lib/utils/browser-mcp-direct';
const analysis = analyzeConsoleErrors(consoleMessages);

// 8. 결과 출력
console.log(`에러: ${analysis.analysis.totalErrors}개`);
console.log(`경고: ${analysis.analysis.totalWarnings}개`);
analysis.analysis.suggestedFixes.forEach(fix => {
  console.log(`- ${fix}`);
});
```

### 예제 2: 에러 분석 및 리포트 생성

```typescript
import { generateErrorReport } from '@/lib/utils/browser-mcp-direct';
import { generateDetailedErrorReport } from '@/lib/utils/error-analyzer';

// 콘솔 메시지 수집
const consoleMessages = await mcp_cursor-ide-browser_browser_console_messages();

// 네트워크 요청 확인
const networkRequests = await mcp_cursor-ide-browser_browser_network_requests();

// 기본 리포트 생성
const basicReport = generateErrorReport(consoleMessages, networkRequests);

// 상세 리포트 생성
const errors = consoleMessages.filter(m => m.level === 'error');
const warnings = consoleMessages.filter(m => m.level === 'warning');
const detailedReport = generateDetailedErrorReport(errors, warnings);

// 결과 출력
console.log('=== 에러 리포트 ===');
console.log(`총 에러: ${detailedReport.summary.totalErrors}개`);
console.log(`심각한 에러: ${detailedReport.summary.criticalErrors}개`);
console.log(`높은 우선순위: ${detailedReport.summary.highPriorityErrors}개`);

console.log('\n=== 권장사항 ===');
detailedReport.recommendations.forEach((rec, index) => {
  console.log(`${index + 1}. ${rec}`);
});

console.log('\n=== 다음 단계 ===');
detailedReport.nextSteps.forEach((step, index) => {
  console.log(`${step}`);
});
```

## 유틸리티 함수 사용

### 워크플로우 가이드 출력

```typescript
import { printBrowserMCPGuide, createAdminAccessWorkflow } from '@/lib/utils/browser-mcp-direct';

// Browser MCP 툴 가이드 출력
printBrowserMCPGuide();

// 관리자 페이지 접속 워크플로우 생성
const workflow = createAdminAccessWorkflow('http://localhost:3000', 'password123');
console.log(workflow);
```

### CLI 스크립트 사용

```bash
# 워크플로우 가이드 출력
npm run admin:ai-workflow

# 에러 분석 예제 출력
npm run admin:ai-workflow example

# 사용 가능한 Browser MCP 툴 목록 출력
npm run admin:ai-workflow tools
```

## 문제 해결

### Browser MCP 툴이 작동하지 않는 경우

1. Browser MCP 서버가 설정되어 있는지 확인
2. Cursor IDE가 최신 버전인지 확인
3. MCP 서버 연결 상태 확인

### 스냅샷에서 요소를 찾을 수 없는 경우

1. 페이지가 완전히 로드될 때까지 대기 (`browser_wait_for` 사용)
2. 요소의 다른 속성으로 검색 (name, role, type 등)
3. 스크린샷을 캡처하여 시각적으로 확인

### 로그인이 실패하는 경우

1. 비밀번호가 올바른지 확인
2. 로그인 폼이 제대로 로드되었는지 확인
3. 네트워크 요청을 확인하여 에러 메시지 확인

## 참고 자료

- [Browser MCP 서버 문서](https://modelcontextprotocol.io/)
- [관리자 페이지 자동화 문서](./ADMIN_PAGE_AUTOMATION.md)
- [에러 분석 유틸리티](../lib/utils/error-analyzer.ts)




