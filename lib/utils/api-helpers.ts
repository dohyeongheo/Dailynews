/**
 * API 헬퍼 함수
 * 공통적으로 사용되는 유틸리티 함수들
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import type { Session } from 'next-auth';
import { createErrorResponse } from './api-response';
import { AuthError, AuthorizationError, BadRequestError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';

/**
 * 인증이 필요한 요청에서 세션을 가져옴
 * 세션이 없으면 401 에러 응답 반환
 */
export async function requireAuth(request: NextRequest): Promise<{ session: Session; response?: NextResponse }> {
  const session = await auth();

  if (!session || !session.user) {
    return {
      session: null as unknown as Session,
      response: createErrorResponse(new AuthError('인증이 필요합니다.'), 401),
    };
  }

  return { session };
}

/**
 * 관리자 권한이 필요함을 확인
 * 관리자가 아니면 403 에러 응답 반환
 */
export function requireAdmin(session: Session): NextResponse | null {
  if (session.user.role !== 'admin') {
    return createErrorResponse(new AuthorizationError('관리자 권한이 필요합니다.'), 403);
  }

  return null;
}

/**
 * 요청에서 사용자 ID 추출
 */
export function getUserId(request: NextRequest, session: Session): string {
  return session.user.id;
}

/**
 * JSON 본문 파싱 및 검증
 * @param request NextRequest 객체
 * @param schema Zod 스키마 (선택)
 * @returns 파싱된 JSON 데이터 또는 에러 응답
 */
export async function parseJsonBody<T>(
  request: NextRequest,
  schema?: z.ZodSchema<T>
): Promise<{ data: T; error?: NextResponse }> {
  try {
    const body = await request.json();

    if (schema) {
      const result = schema.safeParse(body);
      if (!result.success) {
        const errorMessage = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
        return {
          data: null as unknown as T,
          error: createErrorResponse(new BadRequestError(`입력 데이터가 올바르지 않습니다: ${errorMessage}`), 400),
        };
      }
      return { data: result.data };
    }

    return { data: body as T };
  } catch (error) {
    return {
      data: null as unknown as T,
      error: createErrorResponse(new BadRequestError('요청 본문이 올바른 JSON 형식이 아닙니다.'), 400),
    };
  }
}

/**
 * 쿼리 파라미터에서 값 추출
 */
export function getQueryParam(request: NextRequest, key: string): string | null {
  const { searchParams } = new URL(request.url);
  return searchParams.get(key);
}

/**
 * 쿼리 파라미터에서 필수 값 추출
 * 값이 없으면 400 에러 응답 반환
 */
export function requireQueryParam(
  request: NextRequest,
  key: string
): { value: string; error?: NextResponse } {
  const value = getQueryParam(request, key);

  if (!value) {
    return {
      value: '',
      error: createErrorResponse(new BadRequestError(`${key} 파라미터가 필요합니다.`), 400),
    };
  }

  return { value };
}

/**
 * 리소스 존재 여부 확인
 * 리소스가 없으면 404 에러 응답 반환
 */
export function requireResource<T>(
  resource: T | null,
  message: string = '요청한 리소스를 찾을 수 없습니다.'
): { resource: T; error?: NextResponse } {
  if (!resource) {
    return {
      resource: null as unknown as T,
      error: createErrorResponse(new NotFoundError(message), 404),
    };
  }

  return { resource };
}

/**
 * 권한 확인 (작성자 또는 관리자)
 */
export function requireOwnerOrAdmin(
  session: Session,
  ownerId: string,
  message: string = '접근 권한이 없습니다.'
): NextResponse | null {
  const userId = session.user.id;
  const isOwner = userId === ownerId;
  const isAdmin = session.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return createErrorResponse(new AuthorizationError(message), 403);
  }

  return null;
}

