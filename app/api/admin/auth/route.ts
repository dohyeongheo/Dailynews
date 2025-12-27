import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAdminPassword, setAdminSessionCookie, clearAdminSessionCookie, isAdminAuthenticated } from '@/lib/utils/admin-auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/api-response';
import { BadRequestError } from '@/lib/errors';
import { withErrorHandling } from '@/lib/utils/api-middleware';

const loginSchema = z.object({
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
});

/**
 * 관리자 로그인
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { password } = loginSchema.parse(body);

    // 비밀번호 검증
    if (!verifyAdminPassword(password)) {
      return createErrorResponse(new BadRequestError('비밀번호가 올바르지 않습니다.'), 401);
    }

    // 세션 쿠키 설정
    const response = createSuccessResponse({ success: true }, '로그인 성공');
    setAdminSessionCookie(response);

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(new BadRequestError('입력값이 올바르지 않습니다.'), 400);
    }
    throw error;
  }
});

/**
 * 관리자 인증 상태 확인
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const authenticated = isAdminAuthenticated(request);

  return createSuccessResponse(
    { authenticated },
    authenticated ? '인증됨' : '인증되지 않음'
  );
});

/**
 * 관리자 로그아웃
 */
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const response = createSuccessResponse({ success: true }, '로그아웃 성공');
  clearAdminSessionCookie(response);

  return response;
});

