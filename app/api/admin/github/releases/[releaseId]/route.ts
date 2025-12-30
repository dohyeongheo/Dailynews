/**
 * 릴리즈 상세 정보 조회 API
 */

import { NextRequest } from "next/server";
import { withAdmin, withErrorHandling } from "@/lib/utils/api-middleware";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api-response";
import { getRelease } from "@/lib/github/releases";

export const GET = withAdmin(
  withErrorHandling(async (
    request: NextRequest,
    { params }: { params: { releaseId: string } }
  ) => {
    try {
      const releaseId = Number(params.releaseId);
      if (isNaN(releaseId)) {
        return createErrorResponse(new Error("유효하지 않은 releaseId입니다."), 400);
      }

      const release = await getRelease(releaseId);
      return createSuccessResponse(release);
    } catch (error) {
      return createErrorResponse(error);
    }
  })
);

