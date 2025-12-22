import { NextRequest } from "next/server";
import { createComment, getCommentsByNewsId, deleteComment, getCommentById, updateComment, verifyGuestCommentPassword } from "@/lib/db/comments";
import { withRateLimit, withErrorHandling } from "@/lib/utils/api-middleware";
import { RATE_LIMIT_CONFIGS } from "@/lib/utils/rate-limit-helper";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api-response";
import { requireQueryParam, parseJsonBody, requireResource } from "@/lib/utils/api-helpers";
import { BadRequestError, AuthorizationError } from "@/lib/errors";
import { auth } from "@/auth";
import { z } from "zod";

// 스키마 정의
const createCommentSchema = z.object({
  newsId: z.string().uuid(),
  content: z.string().min(1, "댓글 내용이 필요합니다.").max(1000, "댓글은 1000자 이하여야 합니다."),
  guestName: z.string().optional(),
  password: z.string().optional(),
});

const updateCommentSchema = z.object({
  commentId: z.string().uuid(),
  content: z.string().min(1, "댓글 내용이 필요합니다.").max(1000, "댓글은 1000자 이하여야 합니다."),
  password: z.string().optional(), // 비회원 댓글 수정 시 비밀번호 필요
});

const deleteCommentSchema = z.object({
  password: z.string().optional(), // 비회원 댓글 삭제 시 비밀번호 필요
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

export const POST = withRateLimit(RATE_LIMIT_CONFIGS.COMMENTS)(withErrorHandling(async (request: NextRequest) => {
  const bodyResult = await parseJsonBody(request, createCommentSchema);
  if (bodyResult.error) {
    return bodyResult.error;
  }

  const { newsId, content, guestName, password } = bodyResult.data;
  const session = await auth();

  // 회원 또는 비회원 확인
  let userId: string | null = null;
  let finalGuestName: string | undefined;
  let finalPassword: string | undefined;

  if (session?.user?.id) {
    // 회원 댓글
    userId = session.user.id;
  } else {
    // 비회원 댓글
    if (!guestName || !password) {
      return createErrorResponse(new BadRequestError("비회원 댓글은 이름과 비밀번호가 필요합니다."), 400);
    }
    if (password.length !== 4 || !/^\d{4}$/.test(password)) {
      return createErrorResponse(new BadRequestError("비밀번호는 4자리 숫자여야 합니다."), 400);
    }
    if (guestName.trim().length === 0) {
      return createErrorResponse(new BadRequestError("이름을 입력해주세요."), 400);
    }
    finalGuestName = guestName.trim();
    finalPassword = password;
  }

  const comment = await createComment(newsId, userId, content, finalGuestName, finalPassword);
  return createSuccessResponse({ comment }, "댓글이 작성되었습니다.");
}));

export const PATCH = withRateLimit(RATE_LIMIT_CONFIGS.COMMENTS)(withErrorHandling(async (request: NextRequest) => {
  const bodyResult = await parseJsonBody(request, updateCommentSchema);
  if (bodyResult.error) {
    return bodyResult.error;
  }

  const { commentId, content, password } = bodyResult.data;
  const session = await auth();

  const commentResult = requireResource(await getCommentById(commentId), "댓글을 찾을 수 없습니다.");
  if (commentResult.error) {
    return commentResult.error;
  }

  const comment = commentResult.resource;

  // 권한 확인
  if (comment.user_id) {
    // 회원 댓글인 경우
    if (!session?.user?.id) {
      return createErrorResponse(new AuthorizationError("회원 댓글은 로그인이 필요합니다."), 401);
    }
    if (session.user.id !== comment.user_id && session.user.role !== "admin") {
      return createErrorResponse(new AuthorizationError("댓글 수정 권한이 없습니다."), 403);
    }
  } else {
    // 비회원 댓글인 경우
    if (!password) {
      return createErrorResponse(new BadRequestError("비밀번호가 필요합니다."), 400);
    }
    if (password.length !== 4 || !/^\d{4}$/.test(password)) {
      return createErrorResponse(new BadRequestError("비밀번호는 4자리 숫자여야 합니다."), 400);
    }
    const isValidPassword = await verifyGuestCommentPassword(commentId, password);
    if (!isValidPassword) {
      return createErrorResponse(new AuthorizationError("비밀번호가 일치하지 않습니다."), 403);
    }
  }

  const updatedComment = await updateComment(commentId, content);
  return createSuccessResponse({ comment: updatedComment }, "댓글이 수정되었습니다.");
}));

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const commentIdResult = requireQueryParam(request, "commentId");
  if (commentIdResult.error) {
    return commentIdResult.error;
  }

  const bodyResult = await parseJsonBody(request, deleteCommentSchema);
  const password = bodyResult.data?.password;
  const session = await auth();

  const commentResult = requireResource(await getCommentById(commentIdResult.value), "댓글을 찾을 수 없습니다.");
  if (commentResult.error) {
    return commentResult.error;
  }

  const comment = commentResult.resource;

  // 권한 확인
  if (comment.user_id) {
    // 회원 댓글인 경우
    if (!session?.user?.id) {
      return createErrorResponse(new AuthorizationError("회원 댓글은 로그인이 필요합니다."), 401);
    }
    if (session.user.id !== comment.user_id && session.user.role !== "admin") {
      return createErrorResponse(new AuthorizationError("댓글 삭제 권한이 없습니다."), 403);
    }
  } else {
    // 비회원 댓글인 경우
    if (!password) {
      return createErrorResponse(new BadRequestError("비밀번호가 필요합니다."), 400);
    }
    if (password.length !== 4 || !/^\d{4}$/.test(password)) {
      return createErrorResponse(new BadRequestError("비밀번호는 4자리 숫자여야 합니다."), 400);
    }
    const isValidPassword = await verifyGuestCommentPassword(commentIdResult.value, password);
    if (!isValidPassword) {
      return createErrorResponse(new AuthorizationError("비밀번호가 일치하지 않습니다."), 403);
    }
  }

  await deleteComment(commentIdResult.value);
  return createSuccessResponse({ success: true }, "댓글이 삭제되었습니다.");
});
