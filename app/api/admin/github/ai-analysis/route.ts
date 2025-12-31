/**
 * AI 에이전트를 위한 에러 분석 API
 * 워크플로우 실패 자동 감지 및 분석
 */

import { NextRequest } from "next/server";
import { withAdmin, withErrorHandling } from "@/lib/utils/api-middleware";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api-response";
import {
  listWorkflowRuns,
  getWorkflowRun,
  listWorkflowRunJobs,
  getWorkflowRunLogsUrl,
} from "@/lib/github/workflows";
import { listIssues, createIssue } from "@/lib/github/issues";

export const GET = withAdmin(
  withErrorHandling(async (request: NextRequest) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const days = Number(searchParams.get("days")) || 7;
      const autoCreateIssue = searchParams.get("autoCreateIssue") === "true";

      // 최근 N일간 실패한 워크플로우 실행 조회
      const since = new Date();
      since.setDate(since.getDate() - days);

      const failedRuns = await listWorkflowRuns({
        status: "completed",
        conclusion: "failure",
        perPage: 50,
      });

      const analysisResults = [];

      for (const run of failedRuns.workflow_runs.slice(0, 10)) {
        // 최근 N일 이내의 실행만 분석
        if (new Date(run.created_at) < since) {
          continue;
        }

        // 실행 상세 정보 조회
        const runDetails = await getWorkflowRun(run.id);
        const jobs = await listWorkflowRunJobs(run.id);

        // 에러 패턴 분석
        const errorAnalysis = {
          runId: run.id,
          runNumber: run.run_number,
          workflowName: run.name,
          branch: run.head_branch,
          commit: run.head_sha.substring(0, 7),
          event: run.event,
          createdAt: run.created_at,
          htmlUrl: run.html_url,
          jobs: jobs.jobs.map((job) => ({
            name: job.name,
            status: job.status,
            conclusion: job.conclusion,
            steps: job.steps?.map((step: any) => ({
              name: step.name,
              status: step.status,
              conclusion: step.conclusion,
            })),
          })),
          errorPattern: analyzeErrorPattern(jobs.jobs),
          suggestedActions: generateSuggestedActions(run, jobs.jobs),
        };

        analysisResults.push(errorAnalysis);

        // 자동 이슈 생성 (옵션)
        if (autoCreateIssue) {
          try {
            // 유사한 이슈가 있는지 확인
            const existingIssues = await listIssues({
              state: "open",
              labels: "workflow",
              perPage: 10,
            });

            const similarIssue = findSimilarIssue(existingIssues, errorAnalysis);

            if (!similarIssue) {
              // 새 이슈 생성
              await createIssue({
                title: `[워크플로우 실패] ${run.name} - Run #${run.run_number}`,
                body: generateIssueBody(errorAnalysis),
                labels: ["bug", "workflow", "auto-generated"],
              });
            }
          } catch (error) {
            // 이슈 생성 실패는 무시 (로그만 기록)
            console.error("자동 이슈 생성 실패", error);
          }
        }
      }

      return createSuccessResponse({
        totalFailedRuns: failedRuns.total_count,
        analyzedRuns: analysisResults.length,
        results: analysisResults,
        summary: generateSummary(analysisResults),
      });
    } catch (error) {
      return createErrorResponse(error);
    }
  })
);

/**
 * 에러 패턴 분석
 */
function analyzeErrorPattern(jobs: any[]): {
  errorType: string;
  affectedSteps: string[];
  commonErrors: string[];
} {
  const failedSteps: string[] = [];
  const errorMessages: string[] = [];

  jobs.forEach((job) => {
    if (job.conclusion === "failure" && job.steps) {
      job.steps.forEach((step: any) => {
        if (step.conclusion === "failure") {
          failedSteps.push(step.name);
        }
      });
    }
  });

  return {
    errorType: failedSteps.length > 0 ? "STEP_FAILURE" : "UNKNOWN",
    affectedSteps: failedSteps,
    commonErrors: errorMessages,
  };
}

/**
 * 제안된 조치사항 생성
 */
function generateSuggestedActions(run: any, jobs: any[]): string[] {
  const actions: string[] = [];

  // 실패한 작업 확인
  const failedJobs = jobs.filter((job) => job.conclusion === "failure");
  if (failedJobs.length > 0) {
    actions.push("실패한 작업의 로그를 확인하세요");
  }

  // 재시도 가능 여부 판단
  const isRetryable = run.event === "schedule" || run.event === "workflow_dispatch";
  if (isRetryable) {
    actions.push("워크플로우를 재실행할 수 있습니다");
  }

  // 환경 변수 확인
  actions.push("필수 환경 변수가 올바르게 설정되었는지 확인하세요");

  return actions;
}

/**
 * 유사한 이슈 찾기
 */
function findSimilarIssue(issues: any[], analysis: any): any | null {
  // 간단한 유사도 검사 (제목에 워크플로우 이름이 포함되어 있는지)
  return (
    issues.find((issue) => issue.title.includes(analysis.workflowName)) || null
  );
}

/**
 * 이슈 본문 생성
 */
function generateIssueBody(analysis: any): string {
  return `## 워크플로우 실행 실패

**워크플로우**: ${analysis.workflowName}
**실행 번호**: #${analysis.runNumber}
**브랜치**: ${analysis.branch}
**커밋**: ${analysis.commit}
**이벤트**: ${analysis.event}
**실행 시간**: ${new Date(analysis.createdAt).toLocaleString("ko-KR")}

### 에러 분석

**에러 타입**: ${analysis.errorPattern.errorType}
**영향받은 단계**: ${analysis.errorPattern.affectedSteps.join(", ") || "없음"}

### 작업 목록

${analysis.jobs
  .map(
    (job: any) => `- **${job.name}**: ${job.conclusion || job.status}`
  )
  .join("\n")}

### 제안된 조치사항

${analysis.suggestedActions.map((action: string) => `- ${action}`).join("\n")}

### 관련 링크

- [워크플로우 실행 보기](${analysis.htmlUrl})

---
*이 이슈는 자동으로 생성되었습니다.*
`;
}

/**
 * 분석 결과 요약 생성
 */
function generateSummary(results: any[]): {
  totalFailures: number;
  mostCommonError: string;
  affectedWorkflows: string[];
} {
  const workflows = new Set<string>();
  results.forEach((result) => {
    workflows.add(result.workflowName);
  });

  return {
    totalFailures: results.length,
    mostCommonError: "STEP_FAILURE",
    affectedWorkflows: Array.from(workflows),
  };
}


