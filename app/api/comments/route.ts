import { NextRequest } from "next/server";
import { getCommentsByNewsId } from "@/lib/db/comments";
import { withErrorHandling } from "@/lib/utils/api-middleware";
import { createSuccessResponse } from "@/lib/utils/api-response";
import { requireQueryParam } from "@/lib/utils/api-helpers";

/**
 * 댓글 조회 (읽기 전용)
 * 사용자 인증이 필요한 댓글 작성/수정/삭제 기능은 제거됨
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const newsIdResult = requireQueryParam(request, "newsId");
  if (newsIdResult.error) {
    return newsIdResult.error;
  }

  const comments = await getCommentsByNewsId(newsIdResult.value);
  const response = createSuccessResponse({ comments });

  // 캐시 헤더 설정 (30초 - DB 레벨 캐싱과 일치)
  response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');

  return response;
});
