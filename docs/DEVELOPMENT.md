# 개발 환경 가이드

이 문서는 Docker와 Dev Containers를 사용하여 Daily News 프로젝트를 개발하는 방법을 설명합니다.

## 목차

- [Dev Container 시작하기](#dev-container-시작하기)
- [Docker Compose 사용하기](#docker-compose-사용하기)
- [개발 환경 구조](#개발-환경-구조)
- [개발 워크플로우](#개발-워크플로우)
- [문제 해결](#문제-해결)
- [고급 사용법](#고급-사용법)

## Dev Container 시작하기

### 필수 사전 요구사항

1. **Docker Desktop**

   - [Docker Desktop 다운로드](https://www.docker.com/products/docker-desktop/)
   - 설치 후 Docker Desktop 실행 확인
   - Windows의 경우 WSL2가 필요할 수 있습니다

2. **VS Code/Cursor 확장**
   - VS Code: "Dev Containers" 확장 설치
   - Cursor: 기본적으로 Dev Containers 기능이 포함되어 있습니다

### 시작 방법

#### 방법 1: 명령 팔레트 사용

1. VS Code/Cursor에서 프로젝트 폴더를 엽니다
2. 명령 팔레트 열기:
   - Windows/Linux: `Ctrl+Shift+P`
   - macOS: `Cmd+Shift+P`
3. **"Dev Containers: Reopen in Container"** 명령 실행
4. 컨테이너가 빌드되고 연결될 때까지 대기 (처음에는 몇 분 소요될 수 있습니다)

#### 방법 2: 상태바 사용

1. VS Code/Cursor 하단 상태바에서 **"Reopen in Container"** 클릭
2. 컨테이너 빌드 및 연결 대기

### 컨테이너 빌드 및 연결 과정

1. **이미지 빌드**: `Dockerfile`을 기반으로 컨테이너 이미지 생성

   - Node.js 20 Alpine Linux 기반
   - 의존성 설치 (`npm ci`)
   - 소스 코드 복사

2. **컨테이너 시작**: `docker-compose.yml` 설정에 따라 컨테이너 실행

   - 볼륨 마운트 (소스 코드 동기화)
   - 포트 포워딩 (3000 포트)
   - 환경 변수 로드 (`.env.local`)

3. **VS Code/Cursor 연결**: 컨테이너 내부에 연결
   - 확장 프로그램 자동 설치
   - 터미널이 컨테이너 내부에서 실행됨
   - 개발 서버 자동 시작

### 첫 실행 후

- 개발 서버가 자동으로 시작되어 `http://localhost:3000`에서 접근 가능합니다
- 터미널에서 `npm` 명령어를 사용할 수 있습니다
- Git이 설치되어 있어 버전 관리가 가능합니다

### Dev Container와 AI 에이전트 사용 팁

Dev Container 환경에서는 Cursor의 AI 대화 기록이 호스트 환경과 분리됩니다.

#### 새 창이 열리는 이유

Dev Container를 실행하면 Cursor가 **새 창**을 열어 컨테이너 내부 환경을 표시합니다. 창 제목이 "app [Container daily news]"로 표시되는 것이 정상입니다.

#### 권장 워크플로우

**방법 1: 호스트 환경에서 대화, 컨테이너에서 개발 (권장)**

1. **호스트 환경 창**: AI 에이전트와 대화 및 코드 변경 요청

   - 이전 대화 기록 유지
   - 코드 변경 요청 시 AI가 파일 수정

2. **Dev Container 창**: 개발 서버 실행 및 테스트

   - 변경사항 확인
   - 브라우저에서 테스트
   - 필요 시 추가 수정

3. **두 창을 동시에 사용**
   ```
   [호스트 창]          [컨테이너 창]
   - AI 대화            - 개발 서버
   - 코드 편집           - 터미널
   - Git 작업            - 브라우저 테스트
   ```

**방법 2: 컨테이너 환경에서만 작업**

- 컨테이너 창에서 대화를 시작하면 해당 환경에서만 기록이 유지됩니다
- 호스트의 이전 기록은 보이지 않지만, 새로운 대화를 시작할 수 있습니다

#### 실용적인 팁

- **창 전환**: `Ctrl+Tab` (Windows/Linux) / `Cmd+Tab` (macOS)로 창 간 전환
- **대화 맥락 유지**: 컨테이너 창에서 대화할 때는 이전 맥락을 간단히 요약하여 제공
- **하이브리드 방식**: 호스트에서 대화 → 컨테이너에서 테스트 → 문제 발견 시 호스트로 돌아가서 추가 요청

#### 문제 해결

- **개발 서버가 보이지 않으면**: 터미널에서 `npm run dev` 수동 실행
- **창을 닫았을 때**: 명령 팔레트 → "Dev Containers: Attach to Running Container"
- **컨테이너 종료**: 명령 팔레트 → "Dev Containers: Reopen Folder Locally"

## Docker Compose 사용하기

Dev Container를 사용하지 않고 직접 Docker Compose로 컨테이너를 관리할 수도 있습니다.

### 컨테이너 실행

```bash
docker-compose up -d
```

- `-d` 옵션: 백그라운드에서 실행 (detached mode)
- 컨테이너가 시작되면 개발 서버가 자동으로 실행됩니다

### 컨테이너 상태 확인

```bash
docker-compose ps
```

실행 중인 컨테이너 목록과 상태를 확인할 수 있습니다.

### 컨테이너 로그 확인

```bash
docker-compose logs -f app
```

- `-f` 옵션: 실시간 로그 스트리밍
- `app`: 서비스 이름

### 컨테이너 중지

```bash
docker-compose stop
```

컨테이너를 중지하지만 삭제하지는 않습니다.

### 컨테이너 삭제

```bash
docker-compose down
```

컨테이너를 중지하고 삭제합니다.

### 컨테이너 재빌드

의존성이나 Dockerfile이 변경된 경우:

```bash
docker-compose up -d --build
```

`--build` 옵션으로 이미지를 다시 빌드합니다.

## 개발 환경 구조

### 볼륨 마운트

`docker-compose.yml`에서 다음과 같이 볼륨이 설정되어 있습니다:

```yaml
volumes:
  # 소스 코드는 호스트와 동기화 (Hot Reload 지원)
  - .:/app
  # node_modules는 익명 볼륨으로 분리 (호스트와 동기화 안 됨)
  - /app/node_modules
  # .next 빌드 캐시도 익명 볼륨으로 분리
  - /app/.next
```

**설명:**

- **`.:/app`**: 호스트의 현재 디렉토리를 컨테이너의 `/app`에 마운트

  - 소스 코드 변경 시 컨테이너 내부에도 즉시 반영
  - Hot Reload가 정상 작동

- **`/app/node_modules`**: 익명 볼륨으로 분리

  - 호스트와 동기화되지 않음
  - 컨테이너 내부에서 설치한 패키지만 사용
  - 플랫폼 차이로 인한 문제 방지 (Windows vs Linux)

- **`/app/.next`**: Next.js 빌드 캐시 분리
  - 호스트와 동기화되지 않음
  - 빌드 성능 최적화

### 포트 포워딩

```yaml
ports:
  - "3000:3000"
```

- 호스트의 3000 포트를 컨테이너의 3000 포트로 매핑
- `http://localhost:3000`에서 개발 서버 접근 가능

### 환경 변수 로드

```yaml
env_file:
  - .env.local
```

- `.env.local` 파일의 환경 변수가 컨테이너 내부로 자동 로드됩니다
- 파일이 없으면 에러가 발생할 수 있으므로 반드시 생성해야 합니다

## 개발 워크플로우

### 일반적인 개발 사이클

1. **코드 수정**: 호스트에서 파일 편집
2. **자동 반영**: 변경사항이 컨테이너에 즉시 동기화
3. **Hot Reload**: Next.js가 변경사항을 감지하고 자동으로 페이지 새로고침
4. **확인**: 브라우저에서 `http://localhost:3000` 확인

### 의존성 추가/업데이트

#### 새 패키지 추가

컨테이너 내부 터미널에서:

```bash
npm install <package-name>
```

또는 Dev Container를 사용 중이라면 VS Code/Cursor 터미널에서 직접 실행하면 됩니다.

#### package.json 수정 후

`package.json`을 직접 수정한 경우:

```bash
npm install
```

#### 의존성 업데이트

```bash
npm update
```

### Git 사용

컨테이너 내부에 Git이 설치되어 있어 버전 관리가 가능합니다:

```bash
git status
git add .
git commit -m "커밋 메시지"
git push
```

### 개발 서버 재시작

개발 서버를 수동으로 재시작하려면:

```bash
# 컨테이너 내부에서
npm run dev
```

또는 Docker Compose를 사용:

```bash
docker-compose restart app
```

## 문제 해결

### Docker Desktop이 실행되지 않는 경우

**증상:**

```
Error running docker info. Please ensure docker is installed and running
```

**해결 방법:**

1. Docker Desktop이 설치되어 있는지 확인
2. Docker Desktop 실행 확인 (시스템 트레이 아이콘 확인)
3. Windows의 경우 WSL2가 활성화되어 있는지 확인

### 포트 충돌 문제

**증상:**

```
Error: bind: address already in use
```

**해결 방법:**

1. 다른 프로세스가 3000 포트를 사용 중인지 확인:

   ```bash
   # Windows
   netstat -ano | findstr :3000

   # macOS/Linux
   lsof -i :3000
   ```

2. 다른 포트 사용:
   `docker-compose.yml`에서 포트 매핑 변경:
   ```yaml
   ports:
     - "3001:3000" # 호스트 3001 포트 사용
   ```

### 볼륨 마운트 문제

**증상:**

- 파일 변경이 컨테이너에 반영되지 않음
- Hot Reload가 작동하지 않음

**해결 방법:**

1. Docker Desktop의 파일 공유 설정 확인:

   - Settings → Resources → File Sharing
   - 프로젝트 디렉토리가 공유 목록에 있는지 확인

2. 컨테이너 재시작:
   ```bash
   docker-compose restart app
   ```

### 환경 변수 로드 문제

**증상:**

- 환경 변수가 인식되지 않음
- API 키 오류 발생

**해결 방법:**

1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 파일 형식 확인 (공백, 따옴표 등)
3. 컨테이너 재시작:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### 컨테이너가 시작되지 않는 경우

**해결 방법:**

1. 로그 확인:

   ```bash
   docker-compose logs app
   ```

2. 이미지 재빌드:

   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

3. Docker Desktop 재시작

## 고급 사용법

### 컨테이너 내부에서 직접 명령 실행

실행 중인 컨테이너에 접속:

```bash
docker-compose exec app sh
```

또는 특정 명령 실행:

```bash
docker-compose exec app npm run lint
docker-compose exec app npm test
```

### 컨테이너 재빌드

Dockerfile이나 의존성이 변경된 경우:

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

- `--no-cache`: 캐시 없이 완전히 새로 빌드

### 로그 확인

실시간 로그:

```bash
docker-compose logs -f app
```

최근 100줄:

```bash
docker-compose logs --tail=100 app
```

### 컨테이너 정리

사용하지 않는 리소스 정리:

```bash
# 컨테이너 중지 및 삭제
docker-compose down

# 사용하지 않는 이미지 삭제
docker image prune

# 모든 사용하지 않는 리소스 정리 (주의: 다른 프로젝트에도 영향)
docker system prune
```

### 환경 변수 오버라이드

`docker-compose.override.yml` 파일을 생성하여 로컬 설정을 추가할 수 있습니다:

```yaml
services:
  app:
    environment:
      - DEBUG=true
      - LOG_LEVEL=debug
```

이 파일은 `.gitignore`에 추가하여 Git에 커밋하지 않도록 합니다.

### 여러 환경 관리

개발/테스트 환경을 분리하려면:

```bash
# 개발 환경
docker-compose -f docker-compose.yml up -d

# 테스트 환경
docker-compose -f docker-compose.yml -f docker-compose.test.yml up -d
```

## 추가 리소스

- [Docker 공식 문서](https://docs.docker.com/)
- [Dev Containers 문서](https://code.visualstudio.com/docs/devcontainers/containers)
- [Docker Compose 문서](https://docs.docker.com/compose/)
