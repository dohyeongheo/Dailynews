/**
 * 이슈 상세 정보 조회 및 업데이트 API
 */

import { NextRequest } from "next/server";
import { withAdminDynamic, withErrorHandlingDynamic } from "@/lib/utils/api-middleware";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api-response";
import { getIssue, updateIssue } from "@/lib/github/issues";

export const GET = withAdminDynamic(
  withErrorHandlingDynamic(async (
    request: NextRequest,
    { params }: { params: { issueNumber: string } }
  ) => {
    try {
      const issueNumber = Number(params.issueNumber);
      if (isNaN(issueNumber)) {
        return createErrorResponse(new Error("유효하지 않은 issueNumber입니다."), 400);
      }

      const issue = await getIssue(issueNumber);
      return createSuccessResponse(issue);
    } catch (error) {
      return createErrorResponse(error);
    }
  })
);

export const PATCH = withAdminDynamic(
  withErrorHandlingDynamic(async (
    request: NextRequest,
    { params }: { params: { issueNumber: string } }
  ) => {
    try {
      const issueNumber = Number(params.issueNumber);
      if (isNaN(issueNumber)) {
        return createErrorResponse(new Error("유효하지 않은 issueNumber입니다."), 400);
      }

      const body = await request.json();
      const issue = await updateIssue(issueNumber, body);

      return createSuccessResponse(issue, "이슈가 업데이트되었습니다.");
    } catch (error) {
      return createErrorResponse(error);
    }
  })
);

