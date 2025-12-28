/**
 * 표준화된 API 응답 포맷
 */

import type { AppError, ErrorType } from '@/lib/errors';
import { ERROR_TYPE_STATUS_CODE } from '@/lib/errors';
import { NextResponse } from 'next/server';

/**
 * 성공 응답 타입
 */
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

/**
 * 에러 응답 타입
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    type: ErrorType;
    statusCode: number;
    details?: Record<string, unknown>;
  };
}

/**
 * API 응답 타입
 */
export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

/**
 * 성공 응답 생성
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  statusCode: number = 200
): NextResponse<SuccessResponse<T>> {
  const response: SuccessResponse<T> = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  return NextResponse.json(response, { status: statusCode });
}

/**
 * 에러 응답 생성
 */
export function createErrorResponse(
  error: AppError | Error | unknown,
  statusCode?: number
): NextResponse<ErrorResponse> {
  let appError: AppError;

  // AppError 인터페이스를 따르는 객체인지 확인
  if (typeof error === 'object' && error !== null && 'type' in error) {
    appError = error as AppError;
  } else if (error instanceof Error) {
    // Error 인스턴스를 AppError로 변환
    appError = {
      type: 'UNKNOWN_ERROR' as ErrorType,
      message: error.message,
      originalError: error,
      retryable: false,
      statusCode: 500,
    };
  } else {
    // 알 수 없는 에러
    appError = {
      type: 'UNKNOWN_ERROR' as ErrorType,
      message: String(error),
      originalError: error,
      retryable: false,
      statusCode: 500,
    };
  }

  const finalStatusCode = statusCode ?? appError.statusCode ?? ERROR_TYPE_STATUS_CODE[appError.type] ?? 500;

  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: appError.code ?? appError.type,
      message: appError.message,
      type: appError.type,
      statusCode: finalStatusCode,
      details: appError.details,
    },
  };

  return NextResponse.json(errorResponse, { status: finalStatusCode });
}

