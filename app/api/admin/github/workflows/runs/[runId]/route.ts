/**
 * 특정 워크플로우 실행 상세 정보 조회 API
 */

import { NextRequest } from "next/server";
import { withAdmin, withErrorHandling } from "@/lib/utils/api-middleware";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api-response";
import { getWorkflowRun } from "@/lib/github/workflows";

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

      const run = await getWorkflowRun(runId);
      return createSuccessResponse(run);
    } catch (error) {
      return createErrorResponse(error);
    }
  })
);

