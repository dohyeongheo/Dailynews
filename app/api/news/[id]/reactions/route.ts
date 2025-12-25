import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { setNewsReaction, getNewsReactionCounts, getUserNewsReaction } from "@/lib/db/news-reactions";
import { withErrorHandling } from "@/lib/utils/api-middleware";
import { RATE_LIMIT_CONFIGS } from "@/lib/utils/rate-limit-helper";
import { applyRateLimit } from "@/lib/utils/rate-limit-helper";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api-response";
import { parseJsonBody, getUserId } from "@/lib/utils/api-helpers";
import { AuthError, BadRequestError, InternalServerError } from "@/lib/errors";
import { z } from "zod";

const reactionSchema = z.object({
  reactionType: z.enum(["like", "dislike"]),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async (req: NextRequest) => {
    // Rate Limiting 적용
    const rateLimitResponse = await applyRateLimit(req, RATE_LIMIT_CONFIGS.BOOKMARKS);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const session = await auth();
    if (!session || !session.user) {
      return createErrorResponse(new AuthError("인증이 필요합니다."), 401);
    }

    const newsId = params.id;

    const bodyResult = await parseJsonBody(req, reactionSchema);
    if (bodyResult.error) {
      return bodyResult.error;
    }

    const { reactionType } = bodyResult.data;
    const userId = getUserId(req, session);

    const success = await setNewsReaction(newsId, userId, reactionType);

    if (!success) {
      throw new InternalServerError("반응 설정에 실패했습니다.");
    }

    // 업데이트된 반응 개수와 사용자 반응 조회
    const [counts, userReaction] = await Promise.all([
      getNewsReactionCounts(newsId),
      getUserNewsReaction(newsId, userId),
    ]);

    return createSuccessResponse({
      success: true,
      counts,
      userReaction,
    });
  })(request);
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const newsId = params.id;
    const session = await auth();
    const userId = session?.user?.id;

    const [counts, userReaction] = await Promise.all([
      getNewsReactionCounts(newsId),
      userId ? getUserNewsReaction(newsId, userId) : Promise.resolve(null),
    ]);

    const response = createSuccessResponse({
      counts,
      userReaction,
    });

    // 캐시 헤더 설정 (60초 - 반응은 자주 변경될 수 있으므로 짧은 TTL)
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

    return response;
  } catch (error) {
    return createErrorResponse(error);
  }
}
