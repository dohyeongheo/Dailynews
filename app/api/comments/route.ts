import { NextRequest } from "next/server";
import { createComment, getCommentsByNewsId, deleteComment, getCommentById, updateComment } from "@/lib/db/comments";
import { withAuthAndRateLimit, withAuth, withErrorHandling } from "@/lib/utils/api-middleware";
import { RATE_LIMIT_CONFIGS } from "@/lib/utils/rate-limit-helper";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api-response";
import { requireQueryParam, parseJsonBody, requireResource, requireOwnerOrAdmin } from "@/lib/utils/api-helpers";
import { BadRequestError } from "@/lib/errors";
import { z } from "zod";

// 스키마 정의
const createCommentSchema = z.object({
  newsId: z.string().uuid(),
  content: z.string().min(1, "댓글 내용이 필요합니다.").max(1000, "댓글은 1000자 이하여야 합니다."),
});

const updateCommentSchema = z.object({
  commentId: z.string().uuid(),
  content: z.string().min(1, "댓글 내용이 필요합니다.").max(1000, "댓글은 1000자 이하여야 합니다."),
});

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

export const POST = withAuthAndRateLimit(RATE_LIMIT_CONFIGS.COMMENTS)(async (request: NextRequest, session) => {
  const bodyResult = await parseJsonBody(request, createCommentSchema);
  if (bodyResult.error) {
    return bodyResult.error;
  }

  const { newsId, content } = bodyResult.data;

  const comment = await createComment(newsId, session.user.id, content);
  return createSuccessResponse({ comment }, "댓글이 작성되었습니다.");
});

export const PATCH = withAuthAndRateLimit(RATE_LIMIT_CONFIGS.COMMENTS)(async (request: NextRequest, session) => {
  const bodyResult = await parseJsonBody(request, updateCommentSchema);
  if (bodyResult.error) {
    return bodyResult.error;
  }

  const { commentId, content } = bodyResult.data;

  const commentResult = requireResource(await getCommentById(commentId), "댓글을 찾을 수 없습니다.");
  if (commentResult.error) {
    return commentResult.error;
  }

  const comment = commentResult.resource;

  const authResult = requireOwnerOrAdmin(session, comment.user_id, "댓글 수정 권한이 없습니다.");
  if (authResult) {
    return authResult;
  }

  const updatedComment = await updateComment(commentId, content);
  return createSuccessResponse({ comment: updatedComment }, "댓글이 수정되었습니다.");
});

export const DELETE = withAuth(async (request: NextRequest, session) => {
  const commentIdResult = requireQueryParam(request, "commentId");
  if (commentIdResult.error) {
    return commentIdResult.error;
  }

  const commentResult = requireResource(await getCommentById(commentIdResult.value), "댓글을 찾을 수 없습니다.");
  if (commentResult.error) {
    return commentResult.error;
  }

  const comment = commentResult.resource;

  const authResult = requireOwnerOrAdmin(session, comment.user_id, "댓글 삭제 권한이 없습니다.");
  if (authResult) {
    return authResult;
  }

  await deleteComment(commentIdResult.value);
  return createSuccessResponse({ success: true }, "댓글이 삭제되었습니다.");
});
