/**
 * 이슈 목록 조회 및 생성 API
 */

import { NextRequest } from "next/server";
import { withAdmin, withErrorHandling } from "@/lib/utils/api-middleware";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api-response";
import { listIssues, createIssue } from "@/lib/github/issues";

export const GET = withAdmin(
  withErrorHandling(async (request: NextRequest) => {
    try {
      const searchParams = request.nextUrl.searchParams;

      const options = {
        state: (searchParams.get("state") as "open" | "closed" | "all") || "all",
        labels: searchParams.get("labels") || undefined,
        sort: (searchParams.get("sort") as "created" | "updated" | "comments") || "created",
        direction: (searchParams.get("direction") as "asc" | "desc") || "desc",
        since: searchParams.get("since") || undefined,
        perPage: searchParams.get("perPage")
          ? Number(searchParams.get("perPage"))
          : 30,
        page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      };

      const issues = await listIssues(options);
      return createSuccessResponse(issues);
    } catch (error) {
      return createErrorResponse(error);
    }
  })
);

export const POST = withAdmin(
  withErrorHandling(async (request: NextRequest) => {
    try {
      const body = await request.json();
      const { title, body: issueBody, labels, assignees, milestone } = body;

      if (!title || !issueBody) {
        return createErrorResponse(
          new Error("title와 body는 필수입니다."),
          400
        );
      }

      const issue = await createIssue({
        title,
        body: issueBody,
        labels,
        assignees,
        milestone,
      });

      return createSuccessResponse(issue, "이슈가 생성되었습니다.");
    } catch (error) {
      return createErrorResponse(error);
    }
  })
);





