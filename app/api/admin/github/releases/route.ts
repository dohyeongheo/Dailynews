/**
 * 릴리즈 목록 조회 및 생성 API
 */

import { NextRequest } from "next/server";
import { withAdmin, withErrorHandling } from "@/lib/utils/api-middleware";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api-response";
import { listReleases, createRelease } from "@/lib/github/releases";

export const GET = withAdmin(
  withErrorHandling(async (request: NextRequest) => {
    try {
      const searchParams = request.nextUrl.searchParams;

      const options = {
        perPage: searchParams.get("perPage")
          ? Number(searchParams.get("perPage"))
          : 30,
        page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      };

      const releases = await listReleases(options);
      return createSuccessResponse(releases);
    } catch (error) {
      return createErrorResponse(error);
    }
  })
);

export const POST = withAdmin(
  withErrorHandling(async (request: NextRequest) => {
    try {
      const body = await request.json();
      const { tagName, name, body: releaseBody, draft, prerelease, targetCommitish } = body;

      if (!tagName || !name || !releaseBody) {
        return createErrorResponse(
          new Error("tagName, name, body는 필수입니다."),
          400
        );
      }

      const release = await createRelease({
        tagName,
        name,
        body: releaseBody,
        draft: draft || false,
        prerelease: prerelease || false,
        targetCommitish,
      });

      return createSuccessResponse(release, "릴리즈가 생성되었습니다.");
    } catch (error) {
      return createErrorResponse(error);
    }
  })
);





