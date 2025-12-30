# MCP 서버 수동 제거 가이드

## 제거할 MCP 서버

다음 3개의 MCP 서버를 `mcp.json`에서 제거해야 합니다:

1. **MCP_DOCKER** (Docker Hub)
2. **Postman**
3. **Playwright** (선택적)

## 수동 제거 방법

### 방법 1: 파일 직접 편집

1. 파일 열기: `c:\Users\Dohyeongheo\.cursor\mcp.json`

2. 다음 항목들을 제거:

```json
// 제거할 항목 1: MCP_DOCKER
"MCP_DOCKER": {
  "command": "docker",
  "args": [
    "mcp",
    "gateway",
    "run"
  ],
  "env": {
    "LOCALAPPDATA": "C:\\Users\\Dohyeongheo\\AppData\\Local",
    "ProgramData": "C:\\ProgramData",
    "ProgramFiles": "C:\\Program Files"
  }
},

// 제거할 항목 2: Playwright
"Playwright": {
  "command": "npx -y @playwright/mcp@latest",
  "env": {},
  "args": []
},

// 제거할 항목 3: Postman
"Postman": {
  "url": "https://mcp.postman.com/minimal",
  "headers": {
    "Authorization": "Bearer YOUR_POSTMAN_API_KEY"
  }
}
```

3. 최종 `mcp.json` 파일 내용:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=ejrhewxbfxqlguathrxh",
      "headers": {}
    },
    "Vercel": {
      "url": "https://mcp.vercel.com",
      "headers": {}
    },
    "Sentry": {
      "url": "https://mcp.sentry.dev/mcp",
      "headers": {}
    },
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_GITHUB_TOKEN"
      }
    }
  }
}
```

### 방법 2: Cursor 설정 UI 사용

1. Cursor에서 `Ctrl+,` (또는 `Cmd+,`)를 눌러 설정 열기
2. 검색창에 "MCP" 또는 "Model Context Protocol" 입력
3. MCP Servers 설정에서 다음 서버 제거:
   - MCP_DOCKER
   - Postman
   - Playwright (선택적)

## 제거 후 확인

1. Cursor 재시작
2. MCP 서버 연결 상태 확인
3. 유지된 서버들이 정상 작동하는지 확인:
   - Supabase
   - Vercel
   - Sentry
   - GitHub

## 유지된 서버 (4개)

다음 서버들은 **반드시 유지**해야 합니다:

1. ✅ **Supabase** - 데이터베이스 관리 (필수)
2. ✅ **Vercel** - 배포 관리 (필수)
3. ✅ **Sentry** - 에러 모니터링 (필수)
4. ✅ **GitHub** - 리포지토리 관리 (필수)

## 제거 이유 요약

### MCP_DOCKER
- ❌ 인증 설정 필요하지만 설정 안 됨
- ❌ 실제 사용 안 함
- ❌ 부분 성공 상태 (인증 오류)

### Postman
- ❌ API 테스트는 직접 코드로 수행
- ❌ 실제 사용 빈도 매우 낮음
- ❌ 프로젝트 코드에서 사용 안 함

### Playwright
- ⚠️ E2E 테스트 시에만 필요
- ⚠️ 실제 사용 빈도 낮음
- ⚠️ 필요 시 다시 활성화 가능

## 참고 문서

- [MCP 서버 최적화 분석](./MCP_SERVERS_OPTIMIZATION.md)
- [MCP 서버 제거 완료](./MCP_SERVERS_REMOVED.md)

