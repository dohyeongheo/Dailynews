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

// Sentry는 선택적 의존성 (설정되지 않은 경우 무시)
let Sentry: typeof import('@sentry/nextjs') | null = null;
try {
  Sentry = require('@sentry/nextjs');
} catch {
  // Sentry가 설정되지 않은 경우 무시
}

/**
 * 일반 요청 핸들러 타입
 */
type Handler = (request: NextRequest) => Promise<NextResponse>;

/**
 * 동적 라우트 핸들러 타입 (params 포함)
 */
type DynamicHandler<T = Record<string, string>> = (
  request: NextRequest,
  context: { params: T }
) => Promise<NextResponse>;

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
 * Sentry에 에러를 안전하게 전송하는 헬퍼 함수
 */
function captureExceptionToSentry(error: unknown, request: NextRequest, context?: Record<string, unknown>) {
  if (!Sentry) return;

  try {
    const appError = toAppError(error);

    // 민감한 정보 제외한 헤더 생성
    const safeHeaders: Record<string, string> = {};
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-csrf-token'];

    request.headers.forEach((value, key) => {
      if (!sensitiveHeaders.includes(key.toLowerCase())) {
        safeHeaders[key] = value;
      }
    });

    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: {
        path: request.nextUrl.pathname,
        method: request.method,
        errorType: appError.type,
        statusCode: String(appError.statusCode || 500),
      },
      extra: {
        url: request.url,
        pathname: request.nextUrl.pathname,
        searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
        headers: safeHeaders,
        ...context,
      },
      contexts: {
        request: {
          method: request.method,
          url: request.url,
          headers: safeHeaders,
        },
      },
    });
  } catch (sentryError) {
    // Sentry 전송 실패는 무시 (에러 핸들링을 방해하지 않음)
    console.warn('[Sentry] Failed to capture exception:', sentryError);
  }
}

/**
 * 에러 핸들링 미들웨어
 * 핸들러에서 발생한 에러를 표준화된 형태로 변환하고 Sentry에 전송
 */
export function withErrorHandling(handler: Handler): Handler {
  return async (request: NextRequest) => {
    try {
      return await handler(request);
    } catch (error) {
      // Sentry에 에러 전송
      captureExceptionToSentry(error, request);

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

/**
 * 동적 라우트용 관리자 권한 미들웨어
 */
export function withAdminDynamic<T = Record<string, string>>(
  handler: DynamicHandler<T>
): DynamicHandler<T> {
  return async (request: NextRequest, context: { params: T }) => {
    try {
      if (!isAdminAuthenticated(request)) {
        return createErrorResponse(new AuthError('관리자 인증이 필요합니다.'), 401);
      }

      return await handler(request, context);
    } catch (error) {
      const appError = toAppError(error, ErrorType.AUTH_ERROR);
      return createErrorResponse(appError);
    }
  };
}

/**
 * 동적 라우트용 에러 핸들링 미들웨어
 * 핸들러에서 발생한 에러를 표준화된 형태로 변환하고 Sentry에 전송
 */
export function withErrorHandlingDynamic<T = Record<string, string>>(
  handler: DynamicHandler<T>
): DynamicHandler<T> {
  return async (request: NextRequest, context: { params: T }) => {
    try {
      return await handler(request, context);
    } catch (error) {
      // Sentry에 에러 전송 (동적 라우트 파라미터 포함)
      captureExceptionToSentry(error, request, {
        params: context.params,
      });

      const appError = toAppError(error);
      return createErrorResponse(appError);
    }
  };
}

