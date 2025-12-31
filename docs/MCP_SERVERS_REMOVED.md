# MCP 서버 제거 완료

## 제거된 MCP 서버

다음 MCP 서버들이 `mcp.json`에서 제거되었습니다:

### 1. MCP_DOCKER (Docker Hub)

- **제거 이유**:
  - 인증 설정 필요하지만 설정되지 않음
  - 실제 프로젝트에서 사용하지 않음
  - 부분 성공 상태 (인증 오류)
- **영향**: 없음 (프로젝트는 Docker를 사용하지만 Docker Hub MCP는 불필요)

### 2. Postman MCP

- **제거 이유**:
  - API 테스트는 직접 코드로 수행
  - 실제 사용 빈도 매우 낮음
  - 프로젝트 코드에서 사용 안 함
- **영향**: 없음 (API 테스트는 다른 방법으로 수행 가능)

### 3. Playwright MCP

- **제거 이유**:
  - E2E 테스트 시에만 필요
  - 실제 사용 빈도 낮음
  - 필요 시 다시 활성화 가능
- **영향**: E2E 테스트 시 필요하면 다시 추가 가능

## 유지된 MCP 서버 (4개)

### 1. Supabase ⭐⭐⭐⭐⭐

- **용도**: 데이터베이스 관리, 마이그레이션, Analytics
- **사용 빈도**: 매우 높음

### 2. Vercel ⭐⭐⭐⭐

- **용도**: 배포 관리, 빌드 로그 분석
- **사용 빈도**: 높음

### 3. Sentry ⭐⭐⭐⭐

- **용도**: 에러 모니터링, 이슈 관리
- **사용 빈도**: 높음

### 4. GitHub ⭐⭐⭐⭐

- **용도**: 리포지토리 관리, 워크플로우 추적
- **사용 빈도**: 높음

## 최적화 효과

- **MCP 서버 수**: 7개 → 4개 (43% 감소)
- **리소스 사용량**: 감소
- **설정 파일 단순화**: 완료
- **유지보수 부담**: 감소

## 필요 시 다시 추가하는 방법

### Playwright MCP 추가 (E2E 테스트 시)

`mcp.json`에 다음 추가:

```json
{
  "mcpServers": {
    "Playwright": {
      "command": "npx -y @playwright/mcp@latest",
      "env": {},
      "args": []
    }
  }
}
```

### Postman MCP 추가 (API 테스트 시)

`mcp.json`에 다음 추가:

```json
{
  "mcpServers": {
    "Postman": {
      "url": "https://mcp.postman.com/minimal",
      "headers": {
        "Authorization": "Bearer YOUR_POSTMAN_API_KEY"
      }
    }
  }
}
```

## 참고

- 제거된 서버들은 필요 시 언제든지 다시 추가 가능
- 현재 유지된 4개 서버로도 프로젝트의 모든 기능을 충분히 지원
- 추가 최적화가 필요하면 `docs/MCP_SERVERS_OPTIMIZATION.md` 참조




