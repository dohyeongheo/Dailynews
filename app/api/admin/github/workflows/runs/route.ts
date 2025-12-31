/**
 * 워크플로우 실행 기록 조회 API
 */

import { NextRequest } from "next/server";
import { withAdmin, withErrorHandling } from "@/lib/utils/api-middleware";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api-response";
import { listWorkflowRuns } from "@/lib/github/workflows";
import { log } from "@/lib/utils/logger";

export const GET = withAdmin(
  withErrorHandling(async (request: NextRequest) => {
    try {
      const searchParams = request.nextUrl.searchParams;

      const options = {
        workflowId: searchParams.get("workflowId")
          ? Number(searchParams.get("workflowId"))
          : undefined,
        status: searchParams.get("status") as
          | "queued"
          | "in_progress"
          | "completed"
          | undefined,
        conclusion: searchParams.get("conclusion") as
          | "success"
          | "failure"
          | "cancelled"
          | "skipped"
          | undefined,
        event: searchParams.get("event") as
          | "push"
          | "pull_request"
          | "schedule"
          | "workflow_dispatch"
          | undefined,
        actor: searchParams.get("actor") || undefined,
        branch: searchParams.get("branch") || undefined,
        perPage: searchParams.get("perPage")
          ? Number(searchParams.get("perPage"))
          : 30,
        page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      };

      log.info("워크플로우 실행 기록 조회 API 호출 시작", options);

      const runs = await listWorkflowRuns(options);

      // 디버깅: 응답 구조 확인
      log.info("워크플로우 실행 기록 조회 API 응답 구조", {
        hasTotalCount: "total_count" in runs,
        hasWorkflowRuns: "workflow_runs" in runs,
        totalCount: runs.total_count,
        workflowRunsType: typeof runs.workflow_runs,
        workflowRunsLength: runs.workflow_runs?.length || 0,
        workflowRunsIsArray: Array.isArray(runs.workflow_runs),
        firstRun: runs.workflow_runs?.[0] || null,
      });

      log.info("워크플로우 실행 기록 조회 API 호출 성공", {
        totalCount: runs.total_count,
        workflowRunsCount: runs.workflow_runs?.length || 0,
      });

      return createSuccessResponse(runs);
    } catch (error) {
      log.error("워크플로우 실행 기록 조회 API 호출 실패", {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      return createErrorResponse(error);
    }
  })
);


