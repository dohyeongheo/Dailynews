/**
 * Pull Request 목록 조회 및 생성 API
 */

import { NextRequest } from "next/server";
import { withAdmin, withErrorHandling } from "@/lib/utils/api-middleware";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api-response";
import { listPullRequests, createPullRequest } from "@/lib/github/pulls";

export const GET = withAdmin(
  withErrorHandling(async (request: NextRequest) => {
    try {
      const searchParams = request.nextUrl.searchParams;

      const options = {
        state: (searchParams.get("state") as "open" | "closed" | "all") || "all",
        head: searchParams.get("head") || undefined,
        base: searchParams.get("base") || undefined,
        sort: (searchParams.get("sort") as
          | "created"
          | "updated"
          | "popularity"
          | "long-running") || "created",
        direction: (searchParams.get("direction") as "asc" | "desc") || "desc",
        perPage: searchParams.get("perPage")
          ? Number(searchParams.get("perPage"))
          : 30,
        page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      };

      const pulls = await listPullRequests(options);
      return createSuccessResponse(pulls);
    } catch (error) {
      return createErrorResponse(error);
    }
  })
);

export const POST = withAdmin(
  withErrorHandling(async (request: NextRequest) => {
    try {
      const body = await request.json();
      const { title, head, base, body: prBody, draft } = body;

      if (!title || !head || !base) {
        return createErrorResponse(
          new Error("title, head, base는 필수입니다."),
          400
        );
      }

      const pullRequest = await createPullRequest({
        title,
        head,
        base,
        body: prBody,
        draft: draft || false,
      });

      return createSuccessResponse(pullRequest, "Pull Request가 생성되었습니다.");
    } catch (error) {
      return createErrorResponse(error);
    }
  })
);





