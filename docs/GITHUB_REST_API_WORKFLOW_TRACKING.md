# GitHub REST API를 통한 워크플로우 추적 및 프로젝트 관리

분석 일시: 2025-01-29

## 개요

GitHub REST API를 통해 워크플로우 실행 기록 추적 및 프로젝트 관리가 가능합니다. 이 문서는 GitHub REST API를 사용하여 워크플로우 실행 기록을 조회하고, 프로젝트를 관리하는 방법을 설명합니다.

## 1. GitHub REST API 연결 확인

### 테스트 결과

✅ **성공** - GitHub REST API를 통해 워크플로우 실행 기록 및 프로젝트 관리가 가능합니다.

### 인증

GitHub REST API를 사용하려면 Personal Access Token (PAT)이 필요합니다:

- 토큰은 환경 변수 `GITHUB_TOKEN` 또는 `GITHUB_PERSONAL_ACCESS_TOKEN`에 설정해야 합니다
- 필요한 권한:
  - `repo` (전체 저장소 접근)
  - `actions:read` (워크플로우 실행 기록 조회)
  - `workflow:read` (워크플로우 읽기)

## 2. 워크플로우 실행 기록 추적

### 2.1 워크플로우 목록 조회

**엔드포인트**: `GET /repos/{owner}/{repo}/actions/workflows`

**예제**:

```powershell
$headers = @{
    "Authorization" = "token YOUR_TOKEN"
    "Accept" = "application/vnd.github.v3+json"
}
Invoke-RestMethod -Uri "https://api.github.com/repos/dohyeongheo/Dailynews/actions/workflows" -Headers $headers -Method Get
```

**응답 예시**:

```json
{
  "total_count": 2,
  "workflows": [
    {
      "id": 219059166,
      "name": "Fetch News Test",
      "path": ".github/workflows/fetch-news-test.yml",
      "state": "active",
      "created_at": "2025-12-28T02:35:08+07:00",
      "updated_at": "2025-12-28T02:35:08+07:00"
    },
    {
      "id": 219054726,
      "name": "Fetch News Daily",
      "path": ".github/workflows/fetch-news.yml",
      "state": "active",
      "created_at": "2025-12-28T01:55:25+07:00",
      "updated_at": "2025-12-28T01:55:25+07:00"
    }
  ]
}
```

### 2.2 워크플로우 실행 기록 조회

**엔드포인트**: `GET /repos/{owner}/{repo}/actions/runs`

**쿼리 파라미터**:

- `per_page`: 페이지당 결과 수 (기본값: 30, 최대: 100)
- `page`: 페이지 번호
- `status`: 실행 상태 필터 (`queued`, `in_progress`, `completed`)
- `conclusion`: 실행 결론 필터 (`success`, `failure`, `cancelled`, `skipped`)
- `event`: 트리거 이벤트 필터 (`push`, `pull_request`, `schedule`, `workflow_dispatch`)
- `actor`: 실행한 사용자 필터
- `branch`: 브랜치 필터
- `created`: 생성 날짜 필터

**예제**:

```powershell
$headers = @{
    "Authorization" = "token YOUR_TOKEN"
    "Accept" = "application/vnd.github.v3+json"
}
Invoke-RestMethod -Uri "https://api.github.com/repos/dohyeongheo/Dailynews/actions/runs?per_page=5" -Headers $headers -Method Get
```

**응답 예시**:

```json
{
  "total_count": 9,
  "workflow_runs": [
    {
      "id": 20584935330,
      "name": "Fetch News Daily",
      "head_branch": "main",
      "head_sha": "b7c362152b60684c7c210d4cb32ffa3bd8f24c07",
      "run_number": 8,
      "event": "schedule",
      "status": "completed",
      "conclusion": "success",
      "created_at": "2025-12-29T23:23:40Z",
      "updated_at": "2025-12-29T23:27:41Z",
      "jobs_url": "https://api.github.com/repos/dohyeongheo/Dailynews/actions/runs/20584935330/jobs",
      "logs_url": "https://api.github.com/repos/dohyeongheo/Dailynews/actions/runs/20584935330/logs",
      "artifacts_url": "https://api.github.com/repos/dohyeongheo/Dailynews/actions/runs/20584935330/artifacts"
    }
  ]
}
```

### 2.3 특정 워크플로우 실행 상세 정보 조회

**엔드포인트**: `GET /repos/{owner}/{repo}/actions/runs/{run_id}`

**예제**:

```powershell
$runId = 20584935330
Invoke-RestMethod -Uri "https://api.github.com/repos/dohyeongheo/Dailynews/actions/runs/$runId" -Headers $headers -Method Get
```

### 2.4 워크플로우 실행의 작업(Job) 목록 조회

**엔드포인트**: `GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs`

**예제**:

```powershell
$runId = 20584935330
Invoke-RestMethod -Uri "https://api.github.com/repos/dohyeongheo/Dailynews/actions/runs/$runId/jobs" -Headers $headers -Method Get
```

**응답 정보**:

- 각 작업의 상태 및 결론
- 작업 실행 시간
- 작업 로그 URL
- 단계별 실행 정보

### 2.5 워크플로우 로그 다운로드

**엔드포인트**: `GET /repos/{owner}/{repo}/actions/runs/{run_id}/logs`

**예제**:

```powershell
$runId = 20584935330
$response = Invoke-WebRequest -Uri "https://api.github.com/repos/dohyeongheo/Dailynews/actions/runs/$runId/logs" -Headers $headers -Method Get
# 로그는 ZIP 파일로 제공됨
$response.Content | Set-Content -Path "workflow-logs.zip"
```

### 2.6 워크플로우 실행 취소

**엔드포인트**: `POST /repos/{owner}/{repo}/actions/runs/{run_id}/cancel`

**예제**:

```powershell
$runId = 20584935330
Invoke-RestMethod -Uri "https://api.github.com/repos/dohyeongheo/Dailynews/actions/runs/$runId/cancel" -Headers $headers -Method Post
```

### 2.7 워크플로우 재실행

**엔드포인트**: `POST /repos/{owner}/{repo}/actions/runs/{run_id}/rerun`

**예제**:

```powershell
$runId = 20584935330
Invoke-RestMethod -Uri "https://api.github.com/repos/dohyeongheo/Dailynews/actions/runs/$runId/rerun" -Headers $headers -Method Post
```

## 3. 프로젝트 관리

### 3.1 이슈 관리

#### 이슈 목록 조회

**엔드포인트**: `GET /repos/{owner}/{repo}/issues`

**쿼리 파라미터**:

- `state`: 이슈 상태 (`open`, `closed`, `all`)
- `labels`: 라벨 필터
- `sort`: 정렬 기준 (`created`, `updated`, `comments`)
- `direction`: 정렬 방향 (`asc`, `desc`)
- `since`: 특정 날짜 이후의 이슈만 조회

**예제**:

```powershell
Invoke-RestMethod -Uri "https://api.github.com/repos/dohyeongheo/Dailynews/issues?state=all&per_page=10" -Headers $headers -Method Get
```

#### 이슈 생성

**엔드포인트**: `POST /repos/{owner}/{repo}/issues`

**예제**:

```powershell
$body = @{
    title = "워크플로우 실행 실패"
    body = "Fetch News Daily 워크플로우가 실패했습니다."
    labels = @("bug", "workflow")
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://api.github.com/repos/dohyeongheo/Dailynews/issues" -Headers $headers -Method Post -Body $body -ContentType "application/json"
```

#### 이슈 업데이트

**엔드포인트**: `PATCH /repos/{owner}/{repo}/issues/{issue_number}`

**예제**:

```powershell
$issueNumber = 1
$body = @{
    state = "closed"
    state_reason = "completed"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://api.github.com/repos/dohyeongheo/Dailynews/issues/$issueNumber" -Headers $headers -Method Patch -Body $body -ContentType "application/json"
```

### 3.2 Pull Request 관리

#### Pull Request 목록 조회

**엔드포인트**: `GET /repos/{owner}/{repo}/pulls`

**예제**:

```powershell
Invoke-RestMethod -Uri "https://api.github.com/repos/dohyeongheo/Dailynews/pulls?state=all" -Headers $headers -Method Get
```

#### Pull Request 생성

**엔드포인트**: `POST /repos/{owner}/{repo}/pulls`

**예제**:

```powershell
$body = @{
    title = "워크플로우 개선"
    head = "feature-branch"
    base = "main"
    body = "워크플로우 실행 시간을 최적화했습니다."
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://api.github.com/repos/dohyeongheo/Dailynews/pulls" -Headers $headers -Method Post -Body $body -ContentType "application/json"
```

### 3.3 릴리즈 관리

#### 릴리즈 목록 조회

**엔드포인트**: `GET /repos/{owner}/{repo}/releases`

**예제**:

```powershell
Invoke-RestMethod -Uri "https://api.github.com/repos/dohyeongheo/Dailynews/releases" -Headers $headers -Method Get
```

#### 릴리즈 생성

**엔드포인트**: `POST /repos/{owner}/{repo}/releases`

**예제**:

```powershell
$body = @{
    tag_name = "v1.0.0"
    name = "Version 1.0.0"
    body = "첫 번째 릴리즈"
    draft = $false
    prerelease = $false
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://api.github.com/repos/dohyeongheo/Dailynews/releases" -Headers $headers -Method Post -Body $body -ContentType "application/json"
```

## 4. TypeScript/Node.js 구현 예제

### 4.1 워크플로우 실행 기록 조회

```typescript
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
});

// 워크플로우 목록 조회
async function listWorkflows() {
  const { data } = await octokit.rest.actions.listWorkflowsForRepo({
    owner: "dohyeongheo",
    repo: "Dailynews",
  });
  return data;
}

// 워크플로우 실행 기록 조회
async function listWorkflowRuns(workflowId?: number) {
  const { data } = await octokit.rest.actions.listWorkflowRunsForRepo({
    owner: "dohyeongheo",
    repo: "Dailynews",
    workflow_id: workflowId,
    per_page: 10,
  });
  return data;
}

// 특정 워크플로우 실행 상세 정보
async function getWorkflowRun(runId: number) {
  const { data } = await octokit.rest.actions.getWorkflowRun({
    owner: "dohyeongheo",
    repo: "Dailynews",
    run_id: runId,
  });
  return data;
}

// 워크플로우 실행의 작업 목록
async function getWorkflowRunJobs(runId: number) {
  const { data } = await octokit.rest.actions.listJobsForWorkflowRun({
    owner: "dohyeongheo",
    repo: "Dailynews",
    run_id: runId,
  });
  return data;
}
```

### 4.2 이슈 관리

```typescript
// 이슈 목록 조회
async function listIssues() {
  const { data } = await octokit.rest.issues.listForRepo({
    owner: "dohyeongheo",
    repo: "Dailynews",
    state: "all",
    per_page: 10,
  });
  return data;
}

// 이슈 생성
async function createIssue(title: string, body: string, labels?: string[]) {
  const { data } = await octokit.rest.issues.create({
    owner: "dohyeongheo",
    repo: "Dailynews",
    title,
    body,
    labels,
  });
  return data;
}

// 이슈 업데이트
async function updateIssue(
  issueNumber: number,
  updates: {
    state?: "open" | "closed";
    title?: string;
    body?: string;
    labels?: string[];
  }
) {
  const { data } = await octokit.rest.issues.update({
    owner: "dohyeongheo",
    repo: "Dailynews",
    issue_number: issueNumber,
    ...updates,
  });
  return data;
}
```

## 5. 실제 사용 사례

### 5.1 워크플로우 실패 모니터링

```typescript
async function monitorWorkflowFailures() {
  const workflows = await listWorkflows();

  for (const workflow of workflows.workflows) {
    const runs = await listWorkflowRuns(workflow.id);

    const failedRuns = runs.workflow_runs.filter((run) => run.conclusion === "failure");

    if (failedRuns.length > 0) {
      console.log(`워크플로우 "${workflow.name}" 실패: ${failedRuns.length}건`);

      for (const run of failedRuns) {
        // 실패한 워크플로우에 대한 이슈 생성
        await createIssue(
          `워크플로우 "${workflow.name}" 실행 실패 (Run #${run.run_number})`,
          `워크플로우 실행이 실패했습니다.\n\n` +
            `- 실행 번호: ${run.run_number}\n` +
            `- 실행 시간: ${run.created_at}\n` +
            `- 브랜치: ${run.head_branch}\n` +
            `- 커밋: ${run.head_sha}\n` +
            `- 로그: ${run.html_url}`,
          ["bug", "workflow"]
        );
      }
    }
  }
}
```

### 5.2 워크플로우 실행 통계

```typescript
async function getWorkflowStatistics(days: number = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const runs = await listWorkflowRuns();

  const recentRuns = runs.workflow_runs.filter((run) => new Date(run.created_at) >= since);

  const stats = {
    total: recentRuns.length,
    success: recentRuns.filter((r) => r.conclusion === "success").length,
    failure: recentRuns.filter((r) => r.conclusion === "failure").length,
    cancelled: recentRuns.filter((r) => r.conclusion === "cancelled").length,
    successRate: 0,
  };

  stats.successRate = stats.total > 0 ? (stats.success / stats.total) * 100 : 0;

  return stats;
}
```

## 6. GitHub MCP 서버와의 비교

### GitHub MCP 서버

**제공 기능**:

- 리포지토리 정보 조회
- 커밋 및 브랜치 관리
- 파일 내용 조회 및 수정
- 이슈 및 PR 생성 및 관리
- 코드 검색

**제한 사항**:

- 워크플로우 실행 기록 조회 불가
- 워크플로우 로그 조회 불가

### GitHub REST API

**제공 기능**:

- 워크플로우 목록 조회
- 워크플로우 실행 기록 조회
- 워크플로우 실행 상세 정보
- 워크플로우 로그 다운로드
- 워크플로우 실행 취소/재실행
- 이슈 및 PR 관리
- 릴리즈 관리

**장점**:

- 워크플로우 관련 모든 기능 제공
- 상세한 실행 정보 및 로그 접근 가능
- 자동화 및 모니터링에 적합

## 7. 권장 사용 방법

### 워크플로우 추적

1. **GitHub REST API 사용** (권장)

   - 워크플로우 실행 기록 조회
   - 실패 모니터링 및 알림
   - 통계 및 분석

2. **GitHub MCP 서버 사용**
   - 리포지토리 및 코드 관리
   - 이슈 및 PR 관리

### 프로젝트 관리

1. **GitHub MCP 서버 사용** (권장)

   - 간편한 이슈 및 PR 관리
   - 파일 및 코드 관리

2. **GitHub REST API 사용**
   - 고급 기능이 필요한 경우
   - 자동화 스크립트 작성

## 8. 보안 고려사항

1. **Personal Access Token 관리**

   - 토큰을 환경 변수로 관리
   - 최소 권한 원칙 적용
   - 정기적으로 토큰 갱신

2. **API Rate Limit**
   - GitHub API는 시간당 요청 수 제한이 있음
   - Rate Limit 헤더 확인 및 처리
   - 필요시 Exponential Backoff 적용

## 9. 참고 자료

- [GitHub REST API 문서](https://docs.github.com/en/rest)
- [GitHub Actions API 문서](https://docs.github.com/en/rest/actions)
- [GitHub Issues API 문서](https://docs.github.com/en/rest/issues)
- [Octokit.js 라이브러리](https://github.com/octokit/octokit.js)

## 10. 결론

GitHub REST API를 통해 워크플로우 실행 기록 추적 및 프로젝트 관리가 완전히 가능합니다. 특히 워크플로우 관련 기능은 GitHub MCP 서버에서 제공하지 않으므로, REST API를 직접 사용하는 것이 필요합니다.

**권장 사항**:

- 워크플로우 추적: GitHub REST API 사용
- 일반적인 프로젝트 관리: GitHub MCP 서버 사용
- 자동화 및 모니터링: GitHub REST API + TypeScript/Node.js
