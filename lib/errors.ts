/**
 * 에러 타입 정의 및 에러 핸들링 유틸리티
 */

export enum ErrorType {
  DATABASE_ERROR = 'DATABASE_ERROR',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error | unknown;
  code?: string;
  retryable?: boolean;
}

/**
 * 에러 타입별 사용자 친화적 메시지
 */
export function getErrorMessage(error: AppError | Error | unknown): string {
  if (error instanceof Error) {
    // 일반 Error 객체인 경우
    if (error.message.includes('duplicate') || error.message.includes('UNIQUE')) {
      return '이미 존재하는 데이터입니다.';
    }
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return '네트워크 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.';
    }
    if (error.message.includes('timeout')) {
      return '요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.';
    }
    return error.message || '알 수 없는 오류가 발생했습니다.';
  }

  if (typeof error === 'object' && error !== null && 'type' in error) {
    const appError = error as AppError;
    switch (appError.type) {
      case ErrorType.DATABASE_ERROR:
        return '데이터베이스 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      case ErrorType.API_ERROR:
        return 'API 요청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      case ErrorType.VALIDATION_ERROR:
        return appError.message || '입력 데이터가 올바르지 않습니다.';
      case ErrorType.NETWORK_ERROR:
        return '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.';
      default:
        return appError.message || '알 수 없는 오류가 발생했습니다.';
    }
  }

  return '알 수 없는 오류가 발생했습니다.';
}

/**
 * 에러를 AppError로 변환
 */
export function toAppError(error: unknown, type: ErrorType = ErrorType.UNKNOWN_ERROR): AppError {
  if (error instanceof Error) {
    // 데이터베이스 에러 판별
    if (error.message.includes('database') || error.message.includes('SQL') || error.message.includes('duplicate')) {
      return {
        type: ErrorType.DATABASE_ERROR,
        message: error.message,
        originalError: error,
        retryable: !error.message.includes('duplicate'),
      };
    }

    // API 에러 판별
    if (error.message.includes('API') || error.message.includes('fetch') || error.message.includes('network')) {
      return {
        type: ErrorType.NETWORK_ERROR,
        message: error.message,
        originalError: error,
        retryable: true,
      };
    }

    return {
      type,
      message: error.message,
      originalError: error,
      retryable: false,
    };
  }

  return {
    type,
    message: String(error),
    originalError: error,
    retryable: false,
  };
}

/**
 * 재시도 가능한 에러인지 확인
 */
export function isRetryableError(error: AppError | Error | unknown): boolean {
  if (error instanceof Error) {
    return !error.message.includes('duplicate') && !error.message.includes('UNIQUE');
  }

  if (typeof error === 'object' && error !== null && 'retryable' in error) {
    return (error as AppError).retryable === true;
  }

  return false;
}

