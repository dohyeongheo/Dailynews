import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { setCommentReaction, getCommentReactionCounts, getUserCommentReaction } from "@/lib/db/comment-reactions";
import { applyRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/utils/rate-limit-helper";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  // Rate Limiting 적용
  const rateLimitResponse = await applyRateLimit(request, RATE_LIMIT_CONFIGS.COMMENTS);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { reactionType } = await request.json();

    if (reactionType !== "like" && reactionType !== "dislike") {
      return NextResponse.json({ error: "Invalid reaction type" }, { status: 400 });
    }

    const success = await setCommentReaction(params.id, session.user.id, reactionType);

    if (!success) {
      return NextResponse.json({ error: "Failed to set reaction" }, { status: 500 });
    }

    // 업데이트된 반응 개수와 사용자 반응 조회
    const [counts, userReaction] = await Promise.all([getCommentReactionCounts(params.id), getUserCommentReaction(params.id, session.user.id)]);

    return NextResponse.json({
      success: true,
      counts,
      userReaction,
    });
  } catch (error) {
    console.error("Comment reaction error:", error);
    return NextResponse.json({ error: "Failed to set reaction" }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const [counts, userReaction] = await Promise.all([
      getCommentReactionCounts(params.id),
      userId ? getUserCommentReaction(params.id, userId) : Promise.resolve(null),
    ]);

    return NextResponse.json({
      counts,
      userReaction,
    });
  } catch (error) {
    console.error("Get comment reactions error:", error);
    return NextResponse.json({ error: "Failed to get reactions" }, { status: 500 });
  }
}
