import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { setCommentReaction, getCommentReactionCounts, getUserCommentReaction, getUserCommentReactionByIp } from "@/lib/db/comment-reactions";
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
    const commentId = params.id;

    const bodyResult = await parseJsonBody(req, reactionSchema);
    if (bodyResult.error) {
      return bodyResult.error;
    }

    const { reactionType } = bodyResult.data;

    // 회원 또는 비회원 처리
    let userId: string | null = null;
    let guestIp: string | null = null;

    if (session?.user?.id) {
      userId = session.user.id;
    } else {
      // 비회원인 경우 IP 주소 사용
      const forwarded = req.headers.get("x-forwarded-for");
      const realIp = req.headers.get("x-real-ip");
      guestIp = forwarded?.split(",")[0]?.trim() || realIp || req.headers.get("x-vercel-forwarded-for") || "unknown";
    }

    const success = await setCommentReaction(commentId, userId, reactionType, guestIp);

    if (!success) {
      throw new InternalServerError("반응 설정에 실패했습니다.");
    }

    // 업데이트된 반응 개수와 사용자 반응 조회
    const [counts, userReaction] = await Promise.all([
      getCommentReactionCounts(commentId),
      userId ? getUserCommentReaction(commentId, userId) : (guestIp ? getUserCommentReactionByIp(commentId, guestIp) : Promise.resolve(null)),
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

  // 비회원인 경우 IP 주소 사용
  let userReaction: "like" | "dislike" | null = null;
  if (userId) {
    userReaction = await getUserCommentReaction(commentId, userId);
  } else {
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const guestIp = forwarded?.split(",")[0]?.trim() || realIp || request.headers.get("x-vercel-forwarded-for");
    if (guestIp) {
      userReaction = await getUserCommentReactionByIp(commentId, guestIp);
    }
  }

  const counts = await getCommentReactionCounts(commentId);

  return createSuccessResponse({
    counts,
    userReaction,
  });
});
