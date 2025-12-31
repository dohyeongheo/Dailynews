# GitHub 워크플로우 실행 결과 조회 문제 디버깅

**날짜**: 2025-12-30
**문제**: GitHub 관리 페이지에서 워크플로우 실행 결과가 조회되지 않음

## 🔍 문제 분석

### 현재 상황

1. **API 호출 성공**: 네트워크 요청에서 `/api/admin/github/workflows/runs?perPage=20`가 200 OK로 성공
2. **콘솔 로그**: `[INFO] 워크플로우 실행 기록 로드 성공` 메시지가 나타남
3. **화면 표시**: 실행 기록 테이블이 표시되지 않음 ("실행 기록이 없습니다" 메시지 표시 가능)

### 가능한 원인

1. **데이터 구조 불일치**: API 응답 구조와 프론트엔드 접근 경로가 일치하지 않을 수 있음
2. **빈 데이터**: GitHub API가 빈 배열을 반환할 수 있음
3. **에러 처리 부족**: 에러가 발생해도 제대로 처리되지 않을 수 있음

## 📊 데이터 흐름 분석

### 1. GitHub API 응답 구조

```typescript
// lib/github/workflows.ts
const response = await octokit.rest.actions.listWorkflowRunsForRepo({...});
return response.data; // { total_count, workflow_runs }
```

GitHub API 응답:

```json
{
  "total_count": 10,
  "workflow_runs": [...]
}
```

### 2. API 라우트 응답 구조

```typescript
// app/api/admin/github/workflows/runs/route.ts
const runs = await listWorkflowRuns(options); // { total_count, workflow_runs }
return createSuccessResponse(runs);
```

`createSuccessResponse`는 다음과 같이 감싸짐:

```json
{
  "success": true,
  "data": {
    "total_count": 10,
    "workflow_runs": [...]
  }
}
```

### 3. 프론트엔드 접근

```typescript
// components/admin/github/GitHubWorkflows.tsx
const data = await response.json();
const workflowRuns = data.data?.workflow_runs || [];
setRuns(workflowRuns);
```

**접근 경로**: `data.data.workflow_runs` ✅ (올바름)

## 🔧 수정 사항

### 1. 상세한 로깅 추가

**프론트엔드** (`components/admin/github/GitHubWorkflows.tsx`):

```typescript
clientLog.info("워크플로우 실행 기록 API 응답", {
  success: data.success,
  hasData: !!data.data,
  dataKeys: data.data ? Object.keys(data.data) : [],
  workflowRunsType: typeof data.data?.workflow_runs,
  workflowRunsLength: data.data?.workflow_runs?.length,
  fullData: data.data,
});
```

**API 라우트** (`app/api/admin/github/workflows/runs/route.ts`):

```typescript
log.info("워크플로우 실행 기록 조회 API 응답 구조", {
  hasTotalCount: "total_count" in runs,
  hasWorkflowRuns: "workflow_runs" in runs,
  totalCount: runs.total_count,
  workflowRunsType: typeof runs.workflow_runs,
  workflowRunsLength: runs.workflow_runs?.length || 0,
  workflowRunsIsArray: Array.isArray(runs.workflow_runs),
  firstRun: runs.workflow_runs?.[0] || null,
});
```

### 2. 에러 처리 개선

- 에러 발생 시 빈 배열로 설정
- 상세한 에러 메시지 표시
- 로딩 상태 관리 개선

## 🧪 테스트 방법

1. **브라우저 콘솔 확인**:

   - 개발자 도구 열기
   - GitHub 관리 탭 클릭
   - 콘솔에서 로그 확인:
     - `[INFO] 워크플로우 실행 기록 API 응답` 확인
     - `workflowRunsLength` 값 확인
     - `fullData` 구조 확인

2. **네트워크 탭 확인**:

   - `/api/admin/github/workflows/runs?perPage=20` 요청 확인
   - 응답 본문 확인:
     ```json
     {
       "success": true,
       "data": {
         "total_count": ...,
         "workflow_runs": [...]
       }
     }
     ```

3. **서버 로그 확인**:
   - 개발 서버 터미널에서 로그 확인
   - `워크플로우 실행 기록 조회 API 응답 구조` 로그 확인

## 📝 다음 단계

1. ✅ 상세한 로깅 추가 완료
2. ⏳ 실제 데이터 확인 필요
3. ⏳ 문제 원인 파악 후 추가 수정

## 참고

- GitHub API 문서: https://docs.github.com/en/rest/actions/workflow-runs
- 응답 구조: `{ total_count: number, workflow_runs: WorkflowRun[] }`
