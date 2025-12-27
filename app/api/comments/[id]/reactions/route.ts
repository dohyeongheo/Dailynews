import { NextRequest } from "next/server";
import { createSuccessResponse } from "@/lib/utils/api-response";

/**
 * 댓글 반응 조회 (읽기 전용)
 * 사용자 인증이 필요한 좋아요/싫어요 기능은 제거됨
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // 반응 기능이 제거되었으므로 빈 응답 반환
  return createSuccessResponse({
    counts: { likes: 0, dislikes: 0 },
    userReaction: null,
  });
}
