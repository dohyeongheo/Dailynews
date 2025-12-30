/**
 * Pull Request 상세 정보 조회 및 머지 API
 */

import { NextRequest } from "next/server";
import { withAdminDynamic, withErrorHandlingDynamic } from "@/lib/utils/api-middleware";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api-response";
import { getPullRequest, mergePullRequest } from "@/lib/github/pulls";

export const GET = withAdminDynamic(
  withErrorHandlingDynamic(async (
    request: NextRequest,
    { params }: { params: { prNumber: string } }
  ) => {
    try {
      const prNumber = Number(params.prNumber);
      if (isNaN(prNumber)) {
        return createErrorResponse(new Error("유효하지 않은 prNumber입니다."), 400);
      }

      const pullRequest = await getPullRequest(prNumber);
      return createSuccessResponse(pullRequest);
    } catch (error) {
      return createErrorResponse(error);
    }
  })
);

export const POST = withAdminDynamic(
  withErrorHandlingDynamic(async (
    request: NextRequest,
    { params }: { params: { prNumber: string } }
  ) => {
    try {
      const prNumber = Number(params.prNumber);
      if (isNaN(prNumber)) {
        return createErrorResponse(new Error("유효하지 않은 prNumber입니다."), 400);
      }

      const body = await request.json();
      const { action, commit_title, commit_message, merge_method } = body;

      if (action === "merge") {
        const result = await mergePullRequest(prNumber, {
          commit_title,
          commit_message,
          merge_method,
        });
        return createSuccessResponse(result, "Pull Request가 머지되었습니다.");
      }

      return createErrorResponse(new Error("지원하지 않는 action입니다."), 400);
    } catch (error) {
      return createErrorResponse(error);
    }
  })
);

