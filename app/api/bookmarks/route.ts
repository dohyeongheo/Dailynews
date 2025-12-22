import { NextRequest } from "next/server";
import { addBookmark, removeBookmark, getUserBookmarks, isBookmarked } from "@/lib/db/bookmarks";
import { withAuthAndRateLimit, withAuth, withErrorHandling } from "@/lib/utils/api-middleware";
import { RATE_LIMIT_CONFIGS } from "@/lib/utils/rate-limit-helper";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api-response";
import { requireQueryParam, parseJsonBody, getUserId } from "@/lib/utils/api-helpers";
import { BadRequestError } from "@/lib/errors";
import { z } from "zod";

const addBookmarkSchema = z.object({
  newsId: z.string().uuid("올바른 뉴스 ID 형식이 아닙니다."),
});

export const GET = withAuth(async (request: NextRequest, session) => {
  const bookmarks = await getUserBookmarks(session.user.id);
  return createSuccessResponse({ bookmarks });
});

export const POST = withAuthAndRateLimit(RATE_LIMIT_CONFIGS.BOOKMARKS)(async (request: NextRequest, session) => {
  const bodyResult = await parseJsonBody(request, addBookmarkSchema);
  if (bodyResult.error) {
    return bodyResult.error;
  }

  const { newsId } = bodyResult.data;
  const userId = getUserId(request, session);

  // 중복 북마크 체크
  const alreadyBookmarked = await isBookmarked(userId, newsId);
  if (alreadyBookmarked) {
    return createErrorResponse(new BadRequestError("이미 북마크된 뉴스입니다."), 400);
  }

  try {
    await addBookmark(userId, newsId);
    return createSuccessResponse({ success: true }, "북마크가 추가되었습니다.");
  } catch (error) {
    // 중복 키 에러 처리
    if (error instanceof Error && (error.message.includes("duplicate") || error.message.includes("UNIQUE"))) {
      return createErrorResponse(new BadRequestError("이미 북마크된 뉴스입니다."), 400);
    }
    throw error; // 다른 에러는 withErrorHandling이 처리
  }
});

export const DELETE = withAuthAndRateLimit(RATE_LIMIT_CONFIGS.BOOKMARKS)(async (request: NextRequest, session) => {
  const newsIdResult = requireQueryParam(request, "newsId");
  if (newsIdResult.error) {
    return newsIdResult.error;
  }

  const userId = getUserId(request, session);
  await removeBookmark(userId, newsIdResult.value);

  return createSuccessResponse({ success: true }, "북마크가 제거되었습니다.");
});
