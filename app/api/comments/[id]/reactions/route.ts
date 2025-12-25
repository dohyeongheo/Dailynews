import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { setCommentReaction, getCommentReactionCounts, getUserCommentReaction } from "@/lib/db/comment-reactions";
import { withErrorHandling } from "@/lib/utils/api-middleware";
import { applyRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/utils/rate-limit-helper";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api-response";
import { parseJsonBody, getUserId } from "@/lib/utils/api-helpers";
import { AuthError, InternalServerError } from "@/lib/errors";
import { z } from "zod";

const reactionSchema = z.object({
  reactionType: z.enum(["like", "dislike"], {
    errorMap: () => ({ message: "reactionType은 'like' 또는 'dislike'여야 합니다." }),
  }),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async (req: NextRequest) => {
    // Rate Limiting 적용
    const rateLimitResponse = await applyRateLimit(req, RATE_LIMIT_CONFIGS.COMMENTS);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const session = await auth();
    if (!session || !session.user) {
      return createErrorResponse(new AuthError("인증이 필요합니다."), 401);
    }

    const commentId = params.id;

    const bodyResult = await parseJsonBody(req, reactionSchema);
    if (bodyResult.error) {
      return bodyResult.error;
    }

    const { reactionType } = bodyResult.data;
    const userId = getUserId(req, session);

    const success = await setCommentReaction(commentId, userId, reactionType);

    if (!success) {
      throw new InternalServerError("반응 설정에 실패했습니다.");
    }

    // 업데이트된 반응 개수와 사용자 반응 조회
    const [counts, userReaction] = await Promise.all([
      getCommentReactionCounts(commentId),
      getUserCommentReaction(commentId, userId),
    ]);

    return createSuccessResponse({
      success: true,
      counts,
      userReaction,
    });
  })(request);
}

export const GET = withErrorHandling(async (request: NextRequest, { params }: { params: { id: string } }) => {
  const commentId = params.id;
  const session = await auth();
  const userId = session?.user?.id;

  const [counts, userReaction] = await Promise.all([
    getCommentReactionCounts(commentId),
    userId ? getUserCommentReaction(commentId, userId) : Promise.resolve(null),
  ]);

  return createSuccessResponse({
    counts,
    userReaction,
  });
});
