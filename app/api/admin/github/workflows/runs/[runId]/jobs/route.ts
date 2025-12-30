/**
 * 워크플로우 실행의 작업(Job) 목록 조회 API
 */

import { NextRequest } from "next/server";
import { withAdmin, withErrorHandling } from "@/lib/utils/api-middleware";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api-response";
import { listWorkflowRunJobs } from "@/lib/github/workflows";

export const GET = withAdmin(
  withErrorHandling(async (
    request: NextRequest,
    { params }: { params: { runId: string } }
  ) => {
    try {
      const runId = Number(params.runId);
      if (isNaN(runId)) {
        return createErrorResponse(new Error("유효하지 않은 runId입니다."), 400);
      }

      const jobs = await listWorkflowRunJobs(runId);
      return createSuccessResponse(jobs);
    } catch (error) {
      return createErrorResponse(error);
    }
  })
);

