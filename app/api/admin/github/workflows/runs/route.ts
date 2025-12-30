/**
 * 워크플로우 실행 기록 조회 API
 */

import { NextRequest } from "next/server";
import { withAdmin, withErrorHandling } from "@/lib/utils/api-middleware";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api-response";
import { listWorkflowRuns } from "@/lib/github/workflows";

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

      const runs = await listWorkflowRuns(options);
      return createSuccessResponse(runs);
    } catch (error) {
      return createErrorResponse(error);
    }
  })
);

