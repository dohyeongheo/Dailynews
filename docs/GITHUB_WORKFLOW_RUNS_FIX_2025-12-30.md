# GitHub 워크플로우 실행 결과 조회 문제 수정

**수정 날짜**: 2025-12-30
**문제**: GitHub 관리 페이지에서 워크플로우 실행 결과가 조회되지 않는 문제

## 🔍 문제 분석

### 발견된 문제점

1. **에러 처리 부족**:
   - `loadWorkflowRuns` 함수에서 에러 발생 시 `setRuns([])`를 호출하지 않아 이전 데이터가 남아있을 수 있음
   - `data.success`가 false인 경우 처리가 없어 이전 데이터가 그대로 표시될 수 있음

2. **로딩 상태 관리 부족**:
   - `loadWorkflowRuns` 함수에 로딩 상태 관리가 없어 사용자가 로딩 중인지 알 수 없음
   - `isLoading`은 `loadWorkflows`에서만 관리되어 워크플로우 실행 기록 로딩 상태를 반영하지 않음

3. **에러 메시지 부족**:
   - 에러 응답에서 상세한 에러 메시지를 표시하지 않음
   - 디버깅이 어려움

4. **로깅 부족**:
   - API 라우트에서 로깅이 없어 문제 진단이 어려움
   - 성공/실패 여부를 추적하기 어려움

## ✅ 수정 사항

### 1. 프론트엔드 수정 (`components/admin/github/GitHubWorkflows.tsx`)

#### 추가된 기능

1. **로딩 상태 관리**:
   ```typescript
   const [isLoadingRuns, setIsLoadingRuns] = useState(false);
   ```

2. **개선된 에러 처리**:
   ```typescript
   async function loadWorkflowRuns() {
     try {
       setIsLoadingRuns(true);
       // ... API 호출 ...

       if (data.success) {
         const workflowRuns = data.data?.workflow_runs || [];
         setRuns(workflowRuns);
         clientLog.info("워크플로우 실행 기록 로드 성공", {
           count: workflowRuns.length,
           totalCount: data.data?.total_count || 0,
         });
       } else {
         throw new Error(data.error?.message || "워크플로우 실행 기록을 불러올 수 없습니다.");
       }
     } catch (error) {
       // ... 에러 처리 ...
       // 에러 발생 시 빈 배열로 설정하여 이전 데이터가 남지 않도록 함
       setRuns([]);
     } finally {
       setIsLoadingRuns(false);
     }
   }
   ```

3. **상세한 에러 메시지**:
   ```typescript
   if (!response.ok) {
     const errorData = await response.json().catch(() => ({}));
     const errorMessage = errorData?.error?.message || `HTTP ${response.status} 오류가 발생했습니다.`;
     throw new Error(errorMessage);
   }
   ```

4. **로딩 상태 표시 개선**:
   ```typescript
   {isLoading || isLoadingRuns ? (
     <div className="p-6 text-center text-gray-500">로딩 중...</div>
   ) : runs.length === 0 ? (
     <div className="p-6 text-center text-gray-500">실행 기록이 없습니다.</div>
   ) : (
     // ... 테이블 표시 ...
   )}
   ```

### 2. API 라우트 수정 (`app/api/admin/github/workflows/runs/route.ts`)

#### 추가된 기능

1. **로깅 추가**:
   ```typescript
   log.info("워크플로우 실행 기록 조회 API 호출 시작", options);

   const runs = await listWorkflowRuns(options);

   log.info("워크플로우 실행 기록 조회 API 호출 성공", {
     totalCount: runs.total_count,
     workflowRunsCount: runs.workflow_runs?.length || 0,
   });
   ```

2. **에러 로깅 개선**:
   ```typescript
   log.error("워크플로우 실행 기록 조회 API 호출 실패", {
     error,
     errorMessage: error instanceof Error ? error.message : String(error),
   });
   ```

## 📊 수정 전후 비교

### 수정 전

- ❌ 에러 발생 시 이전 데이터가 남아있음
- ❌ 로딩 상태가 워크플로우 실행 기록 로딩을 반영하지 않음
- ❌ 에러 메시지가 부족함
- ❌ 로깅이 없어 문제 진단이 어려움

### 수정 후

- ✅ 에러 발생 시 빈 배열로 설정하여 이전 데이터가 남지 않음
- ✅ `isLoadingRuns` 상태로 워크플로우 실행 기록 로딩 상태를 정확히 반영
- ✅ 상세한 에러 메시지 표시
- ✅ 로깅 추가로 문제 진단이 쉬워짐

## 🧪 테스트 방법

1. **정상 케이스**:
   - 관리자 페이지 접속
   - GitHub 관리 탭 클릭
   - 워크플로우 탭 확인
   - 실행 기록이 정상적으로 표시되는지 확인

2. **에러 케이스**:
   - GitHub 토큰을 제거하거나 잘못된 토큰 설정
   - 워크플로우 실행 기록 조회 시도
   - 에러 메시지가 정상적으로 표시되는지 확인
   - 이전 데이터가 남아있지 않은지 확인

3. **로딩 상태**:
   - 워크플로우 실행 기록 조회 시 "로딩 중..." 메시지가 표시되는지 확인
   - 로딩 완료 후 데이터가 정상적으로 표시되는지 확인

## 📝 참고 사항

- GitHub API 응답 구조: `{ total_count, workflow_runs }`
- API 응답 구조: `{ success: true, data: { total_count, workflow_runs } }`
- 프론트엔드에서 접근: `data.data.workflow_runs`

## ✅ 완료 사항

- [x] 프론트엔드 에러 처리 개선
- [x] 로딩 상태 관리 추가
- [x] 상세한 에러 메시지 표시
- [x] API 라우트 로깅 추가
- [x] 에러 발생 시 빈 배열로 설정




