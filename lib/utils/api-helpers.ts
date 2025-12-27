/**
 * API 헬퍼 함수
 * 공통적으로 사용되는 유틸리티 함수들
 */

import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from './api-response';
import { BadRequestError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';

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


