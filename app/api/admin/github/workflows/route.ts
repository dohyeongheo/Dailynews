/**
 * 워크플로우 목록 조회 API
 */

import { NextRequest } from "next/server";
import { withAdmin, withErrorHandling } from "@/lib/utils/api-middleware";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api-response";
import { listWorkflows } from "@/lib/github/workflows";
import { log } from "@/lib/utils/logger";

export const GET = withAdmin(
  withErrorHandling(async (request: NextRequest) => {
    try {
      log.info("워크플로우 목록 API 호출 시작");
      const workflows = await listWorkflows();
      log.info("워크플로우 목록 API 호출 성공", { 
        totalCount: workflows.total_count,
        workflowsCount: workflows.workflows?.length || 0 
      });
      return createSuccessResponse(workflows);
    } catch (error) {
      log.error("워크플로우 목록 API 호출 실패", {
        error,
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      return createErrorResponse(error);
    }
  })
);

