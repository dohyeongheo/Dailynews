# MCP 서버 설정 가이드

이 문서는 Dailynews 프로젝트에서 MCP (Model Context Protocol) 서버를 설정하고 사용하는 방법을 안내합니다.

## 목차

1. [MCP 서버 개요](#mcp-서버-개요)
2. [Supabase MCP 서버](#supabase-mcp-서버)
3. [Docker MCP 서버](#docker-mcp-서버)
4. [설정 방법](#설정-방법)
5. [사용 예제](#사용-예제)

## MCP 서버 개요

MCP 서버는 AI 어시스턴트가 프로젝트의 다양한 도구와 데이터 소스에 안전하게 접근할 수 있게 해주는 프로토콜입니다.

### 현재 프로젝트에서 사용 가능한 MCP 서버

1. **Supabase MCP 서버**: 데이터베이스 쿼리 실행, 마이그레이션 관리, 로그 확인
2. **Docker MCP 서버**: 컨테이너 관리, 이미지 빌드, 로그 확인

## Supabase MCP 서버

### 기능

- 데이터베이스 쿼리 실행
- 테이블 목록 조회
- 마이그레이션 관리
- 로그 확인
- 보안 권고사항 확인
- TypeScript 타입 생성

### 필요 조건

- Supabase 프로젝트 URL
- Supabase Service Role Key

이 정보들은 `.env.local` 파일에 이미 설정되어 있어야 합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 설정 방법

#### 방법 1: Cursor 설정 UI 사용 (권장)

1. Cursor에서 `Ctrl+,` (또는 `Cmd+,`)를 눌러 설정을 엽니다
2. 검색창에 "MCP" 또는 "Model Context Protocol" 입력
3. MCP Servers 설정에서 "Add Server" 클릭
4. 다음 정보 입력:
   - **Name**: `supabase`
   - **Command**: `npx`
   - **Args**: `-y`, `@supabase/mcp-server-supabase`
   - **Environment Variables**:
     - `SUPABASE_URL`: `.env.local`의 `NEXT_PUBLIC_SUPABASE_URL` 값
     - `SUPABASE_SERVICE_ROLE_KEY`: `.env.local`의 `SUPABASE_SERVICE_ROLE_KEY` 값

#### 방법 2: 설정 파일 직접 수정

Cursor의 MCP 설정 파일 위치는 OS에 따라 다릅니다:

- **Windows**: `%USERPROFILE%\.cursor\mcp.json` (예: `C:\Users\YourUsername\.cursor\mcp.json`)
- **macOS**: `~/.cursor/mcp.json`
- **Linux**: `~/.cursor/mcp.json`

> **참고**: Windows에서는 `%APPDATA%\Cursor\User\settings.json`에 설정할 수도 있지만, 전용 MCP 설정 파일인 `mcp.json`을 사용하는 것이 권장됩니다.

설정 파일에 다음 내용을 추가합니다:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase"],
      "env": {
        "SUPABASE_URL": "your_supabase_project_url",
        "SUPABASE_SERVICE_ROLE_KEY": "your_service_role_key"
      }
    }
  }
}
```

> **보안 주의**: Service Role Key는 민감한 정보이므로 Git에 커밋하지 마세요. 환경 변수나 Cursor의 보안 저장소를 사용하세요.

### 사용 예제

설정이 완료되면, Cursor에서 다음과 같은 작업을 요청할 수 있습니다:

- "Supabase 테이블 목록을 보여줘"
- "news 테이블의 스키마를 확인해줘"
- "최근 마이그레이션 목록을 보여줘"
- "보안 권고사항을 확인해줘"
- "데이터베이스 로그를 확인해줘"

## Docker MCP 서버

### 기능

- 컨테이너 목록 조회
- 컨테이너 로그 확인
- 이미지 빌드 및 관리
- 네트워크 관리
- 볼륨 관리

### 필요 조건

- Docker Desktop이 설치되어 있고 실행 중이어야 합니다

### 설정 방법

#### 방법 1: Cursor 설정 UI 사용 (권장)

1. Cursor에서 `Ctrl+,` (또는 `Cmd+,`)를 눌러 설정을 엽니다
2. 검색창에 "MCP" 또는 "Model Context Protocol" 입력
3. MCP Servers 설정에서 "Add Server" 클릭
4. 다음 정보 입력:
   - **Name**: `docker`
   - **Command**: `npx`
   - **Args**: `-y`, `mcp-server-docker`
   - **Environment Variables**:
     - `ALLOWED_CONTAINERS`: `dailynews-dev,app`

#### 방법 2: 설정 파일 직접 수정

설정 파일에 다음 내용을 추가합니다:

```json
{
  "mcpServers": {
    "docker": {
      "command": "npx",
      "args": ["-y", "mcp-server-docker"],
      "env": {
        "ALLOWED_CONTAINERS": "dailynews-dev,app"
      }
    }
  }
}
```

> **참고**: `ALLOWED_CONTAINERS` 환경 변수에 접근을 허용할 컨테이너 이름을 쉼표로 구분하여 지정합니다. 현재 프로젝트는 `dailynews-dev` 컨테이너와 `app` 서비스를 사용합니다.

### 사용 예제

설정이 완료되면, Cursor에서 다음과 같은 작업을 요청할 수 있습니다:

- "실행 중인 Docker 컨테이너를 보여줘"
- "dailynews-dev 컨테이너의 로그를 확인해줘"
- "Docker 이미지 목록을 보여줘"

## 설정 확인

### MCP 서버 상태 확인

1. Cursor에서 AI 어시스턴트에게 "현재 사용 가능한 MCP 서버 목록을 보여줘"라고 요청
2. 또는 Cursor의 설정에서 MCP Servers 섹션 확인

### 테스트

각 MCP 서버가 정상 작동하는지 테스트하려면:

#### Supabase MCP 테스트

- "Supabase 프로젝트의 테이블 목록을 조회해줘"
- "news 테이블의 구조를 확인해줘"

#### Docker MCP 테스트

- "현재 실행 중인 Docker 컨테이너를 보여줘"
- "dailynews-dev 컨테이너의 상태를 확인해줘"

## 문제 해결

### Supabase MCP 서버가 작동하지 않는 경우

1. **환경 변수 확인**

   - `.env.local` 파일에 `NEXT_PUBLIC_SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY`가 올바르게 설정되어 있는지 확인
   - Cursor 설정에서 환경 변수가 올바르게 전달되고 있는지 확인

2. **네트워크 연결 확인**

   - Supabase 프로젝트 URL에 접근할 수 있는지 확인
   - 방화벽이나 네트워크 정책이 연결을 차단하지 않는지 확인

3. **권한 확인**
   - Service Role Key가 올바른지 확인 (Supabase 대시보드에서 확인 가능)
   - 키가 만료되지 않았는지 확인

### Docker MCP 서버가 작동하지 않는 경우

1. **ALLOWED_CONTAINERS 환경 변수 확인**

   - `ALLOWED_CONTAINERS` 환경 변수가 올바르게 설정되어 있는지 확인
   - 컨테이너 이름을 쉼표로 구분하여 지정 (예: `dailynews-dev,app`)
   - 실제 컨테이너 이름과 일치하는지 확인 (`docker ps`로 확인 가능)

2. **Docker Desktop 실행 확인**

   - Docker Desktop이 실행 중인지 확인
   - 터미널에서 `docker ps` 명령어가 정상 작동하는지 확인

3. **Docker CLI 경로 확인**

   - Cursor가 Docker CLI를 찾을 수 있는지 확인
   - PATH 환경 변수에 Docker가 포함되어 있는지 확인

4. **권한 확인**
   - Docker 명령어를 실행할 권한이 있는지 확인

5. **MCP 서버 재시작**
   - 설정 변경 후 Cursor를 완전히 재시작하여 변경 사항이 적용되도록 함

## 추가 리소스

- [Model Context Protocol 공식 문서](https://modelcontextprotocol.io/)
- [Supabase MCP 서버 문서](https://github.com/modelcontextprotocol/servers/tree/main/src/supabase)
- [Docker MCP 서버 문서](https://github.com/modelcontextprotocol/servers/tree/main/src/docker)

## 참고 사항

- MCP 서버 설정은 Cursor를 재시작해야 적용될 수 있습니다
- 환경 변수에 민감한 정보가 포함되어 있으므로, Git에 커밋하지 않도록 주의하세요
- 프로젝트의 `.cursor/mcp-config.example.json` 파일은 예제 설정입니다 (실제 값은 포함하지 않음)


