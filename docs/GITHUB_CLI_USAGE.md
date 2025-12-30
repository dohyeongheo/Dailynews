# GitHub CLI 스크립트 사용 가이드

## 개요

터미널에서 GitHub 워크플로우 추적 및 프로젝트 관리 기능을 사용하는 방법을 설명합니다.

## 사전 요구사항

1. 환경 변수 설정:
   - `GITHUB_TOKEN` 또는 `GITHUB_PERSONAL_ACCESS_TOKEN`
   - `GITHUB_OWNER` (선택사항, 기본값: dohyeongheo)
   - `GITHUB_REPO` (선택사항, 기본값: Dailynews)

2. Node.js 및 npm 설치 확인

## 워크플로우 관리

### 워크플로우 목록 조회

```bash
npm run github:workflows list
```

**출력 예시**:
```
📋 워크플로우 목록 조회 중...

총 2개 워크플로우

  Fetch News Test
    ID: 219059166
    경로: .github/workflows/fetch-news-test.yml
    상태: active
    생성일: 2025-12-28 오전 2:35:08

  Fetch News Daily
    ID: 219054726
    경로: .github/workflows/fetch-news.yml
    상태: active
    생성일: 2025-12-28 오전 1:55:25
```

### 워크플로우 실행 기록 조회

```bash
npm run github:workflows runs
```

**출력 예시**:
```
📋 워크플로우 실행 기록 조회 중...

총 9개 실행 기록

✅ Fetch News Daily - Run #8
    브랜치: main
    이벤트: schedule
    상태: success
    실행 시간: 2025-12-29 오후 11:23:40
    URL: https://github.com/dohyeongheo/Dailynews/actions/runs/20584935330
```

### 특정 실행 상세 정보

```bash
npm run github:workflows show <runId>
```

**예시**:
```bash
npm run github:workflows show 20584935330
```

**출력 예시**:
```
📋 워크플로우 실행 #20584935330 상세 정보 조회 중...

워크플로우: Fetch News Daily
실행 번호: #8
브랜치: main
커밋: b7c3621
이벤트: schedule
상태: completed
결론: success
생성일: 2025-12-29 오후 11:23:40
업데이트: 2025-12-29 오후 11:27:41
URL: https://github.com/dohyeongheo/Dailynews/actions/runs/20584935330

📋 작업 목록:
  ✅ fetch-news
    상태: success
    시작: 2025-12-29 오후 11:23:43
    완료: 2025-12-29 오후 11:27:40
    URL: https://github.com/dohyeongheo/Dailynews/actions/runs/20584935330/job/59119567272
```

## 이슈 관리

### 이슈 목록 조회

```bash
npm run github:issues list
```

**출력 예시**:
```
📋 이슈 목록 조회 중...

🟢 #1 워크플로우 실행 실패
    상태: open
    작성자: dohyeongheo
    생성일: 2025-12-29 오후 2:00:00
    라벨: bug, workflow
    URL: https://github.com/dohyeongheo/Dailynews/issues/1
```

### 이슈 생성

```bash
npm run github:issues create "이슈 제목" "이슈 내용"
```

**예시**:
```bash
npm run github:issues create "버그 리포트" "이미지 생성이 실패합니다."
```

**출력 예시**:
```
📝 새 이슈 생성

제목: 버그 리포트
내용: 이미지 생성이 실패합니다.

✅ 이슈가 생성되었습니다!
   번호: #2
   URL: https://github.com/dohyeongheo/Dailynews/issues/2
```

### 이슈 상세 정보

```bash
npm run github:issues show <issueNumber>
```

**예시**:
```bash
npm run github:issues show 1
```

## Pull Request 관리

### PR 목록 조회

```bash
npm run github:pulls list
```

**출력 예시**:
```
📋 Pull Request 목록 조회 중...

🟢 #1 워크플로우 개선
    상태: open
    브랜치: feature-branch → main
    작성자: dohyeongheo
    생성일: 2025-12-29 오후 3:00:00
    URL: https://github.com/dohyeongheo/Dailynews/pull/1
```

### PR 상세 정보

```bash
npm run github:pulls show <prNumber>
```

**예시**:
```bash
npm run github:pulls show 1
```

## 릴리즈 관리

### 릴리즈 목록 조회

```bash
npm run github:releases list
```

**출력 예시**:
```
📋 릴리즈 목록 조회 중...

 Version 1.0.0 (v1.0.0)
    작성자: dohyeongheo
    생성일: 2025-12-29 오후 4:00:00
    발행일: 2025-12-29 오후 4:05:00
    URL: https://github.com/dohyeongheo/Dailynews/releases/tag/v1.0.0
```

### 릴리즈 상세 정보

```bash
npm run github:releases show <releaseId>
```

**예시**:
```bash
npm run github:releases show 12345678
```

## AI 에이전트와 함께 사용

터미널 CLI 스크립트는 AI 에이전트가 자동으로 실행할 수 있습니다:

### 예시 1: 실패한 워크플로우 찾기

**AI 에이전트 요청**:
```
"최근 실패한 워크플로우 실행을 찾아줘"
```

**AI 에이전트 실행**:
```bash
npm run github:workflows runs
# 결과를 분석하여 실패한 실행만 필터링
```

### 예시 2: 이슈 자동 생성

**AI 에이전트 요청**:
```
"워크플로우 실패에 대한 이슈를 생성해줘"
```

**AI 에이전트 실행**:
```bash
npm run github:issues create "[워크플로우 실패] Fetch News Daily" "워크플로우 실행이 실패했습니다."
```

## 환경 변수 설정

### Windows (PowerShell)

```powershell
$env:GITHUB_TOKEN = "your_github_token"
$env:GITHUB_OWNER = "dohyeongheo"
$env:GITHUB_REPO = "Dailynews"
```

### Linux/macOS

```bash
export GITHUB_TOKEN="your_github_token"
export GITHUB_OWNER="dohyeongheo"
export GITHUB_REPO="Dailynews"
```

### .env 파일 사용

프로젝트 루트에 `.env` 파일 생성:

```
GITHUB_TOKEN=your_github_token
GITHUB_OWNER=dohyeongheo
GITHUB_REPO=Dailynews
```

## 문제 해결

### "GITHUB_TOKEN이 설정되지 않았습니다" 오류

- 환경 변수가 올바르게 설정되었는지 확인
- `.env` 파일이 프로젝트 루트에 있는지 확인
- 서버 재시작 필요할 수 있음

### "Rate Limit이 초과되었습니다" 오류

- GitHub API Rate Limit에 도달
- 잠시 후 다시 시도
- Rate Limit 상태 확인: `curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/rate_limit`

### 스크립트 실행 권한 오류

- Windows에서는 문제 없음
- Linux/macOS에서는 실행 권한 확인: `chmod +x scripts/github/*.ts`

## 참고 자료

- [GitHub REST API 워크플로우 추적 가이드](./GITHUB_REST_API_WORKFLOW_TRACKING.md)
- [관리자 페이지 사용 가이드](./GITHUB_ADMIN_USAGE.md)
- [AI 에이전트 에러 트래킹 분석](./AI_AGENT_ERROR_TRACKING_ANALYSIS.md)

