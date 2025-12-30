/**
 * 워크플로우 실행 취소 API
 */

import { NextRequest } from "next/server";
import { withAdmin, withErrorHandling } from "@/lib/utils/api-middleware";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api-response";
import { cancelWorkflowRun } from "@/lib/github/workflows";

export const POST = withAdmin(
  withErrorHandling(async (
    request: NextRequest,
    { params }: { params: { runId: string } }
  ) => {
    try {
      const runId = Number(params.runId);
      if (isNaN(runId)) {
        return createErrorResponse(new Error("유효하지 않은 runId입니다."), 400);
      }

      const result = await cancelWorkflowRun(runId);
      return createSuccessResponse(result, "워크플로우 실행이 취소되었습니다.");
    } catch (error) {
      return createErrorResponse(error);
    }
  })
);

