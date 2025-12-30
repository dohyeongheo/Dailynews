/**
 * 워크플로우 목록 조회 API
 */

import { NextRequest } from "next/server";
import { withAdmin, withErrorHandling } from "@/lib/utils/api-middleware";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api-response";
import { listWorkflows } from "@/lib/github/workflows";

export const GET = withAdmin(
  withErrorHandling(async (request: NextRequest) => {
    try {
      const workflows = await listWorkflows();
      return createSuccessResponse(workflows);
    } catch (error) {
      return createErrorResponse(error);
    }
  })
);

