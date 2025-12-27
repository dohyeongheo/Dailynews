/**
 * API 미들웨어 유틸리티
 * 공통 기능(인증, Rate Limiting, 에러 핸들링 등)을 래퍼로 제공
 */

import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit, type RATE_LIMIT_CONFIGS } from './rate-limit-helper';
import { createErrorResponse } from './api-response';
import { AuthError, AuthorizationError, type AppError } from '@/lib/errors';
import { toAppError } from '@/lib/errors';
import { ErrorType } from '@/lib/errors';
import { isAdminAuthenticated } from './admin-auth';

/**
 * 일반 요청 핸들러 타입
 */
type Handler = (request: NextRequest) => Promise<NextResponse>;

/**
 * Rate Limit 설정 타입
 */
type RateLimitConfig = {
  maxRequests: number;
  windowMs: number;
};


/**
 * Rate Limiting 미들웨어
 * Rate Limit 초과 시 429 에러 반환
 */
export function withRateLimit(config: RateLimitConfig): (handler: Handler) => Handler {
  return (handler: Handler) => {
    return async (request: NextRequest) => {
      const rateLimitResponse = await applyRateLimit(request, config);
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      return await handler(request);
    };
  };
}

/**
 * 관리자 권한이 필요한 미들웨어
 * 관리자 인증이 없으면 401 에러 반환
 */
export function withAdmin(handler: Handler): Handler {
  return async (request: NextRequest) => {
    try {
      if (!isAdminAuthenticated(request)) {
        return createErrorResponse(new AuthError('관리자 인증이 필요합니다.'), 401);
      }

      return await handler(request);
    } catch (error) {
      const appError = toAppError(error, ErrorType.AUTH_ERROR);
      return createErrorResponse(appError);
    }
  };
}

/**
 * 에러 핸들링 미들웨어
 * 핸들러에서 발생한 에러를 표준화된 형태로 변환
 */
export function withErrorHandling(handler: Handler): Handler {
  return async (request: NextRequest) => {
    try {
      return await handler(request);
    } catch (error) {
      const appError = toAppError(error);
      return createErrorResponse(appError);
    }
  };
}

/**
 * 여러 미들웨어를 조합하는 함수
 * 오른쪽에서 왼쪽으로 적용됨 (함수 합성)
 */
export function combine(...middlewares: Array<(handler: Handler) => Handler>): (handler: Handler) => Handler {
  return (handler: Handler) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}

/**
 * 관리자 + Rate Limiting 조합
 */
export function withAdminAndRateLimit(config: RateLimitConfig): (handler: Handler) => Handler {
  return (handler: Handler) => {
    return combine(withRateLimit(config), withErrorHandling)(withAdmin(handler));
  };
}

