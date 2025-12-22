/**
 * 에러 타입 정의 및 에러 핸들링 유틸리티
 */

export enum ErrorType {
  DATABASE_ERROR = 'DATABASE_ERROR',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  BAD_REQUEST_ERROR = 'BAD_REQUEST_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error | unknown;
  code?: string;
  retryable?: boolean;
  statusCode?: number;
  details?: Record<string, unknown>;
}

/**
 * HTTP 상태 코드와 ErrorType 매핑
 */
export const ERROR_TYPE_STATUS_CODE: Record<ErrorType, number> = {
  [ErrorType.DATABASE_ERROR]: 500,
  [ErrorType.API_ERROR]: 500,
  [ErrorType.VALIDATION_ERROR]: 400,
  [ErrorType.NETWORK_ERROR]: 503,
  [ErrorType.QUOTA_EXCEEDED]: 429,
  [ErrorType.UNKNOWN_ERROR]: 500,
  [ErrorType.AUTH_ERROR]: 401,
  [ErrorType.AUTHORIZATION_ERROR]: 403,
  [ErrorType.NOT_FOUND_ERROR]: 404,
  [ErrorType.RATE_LIMIT_ERROR]: 429,
  [ErrorType.BAD_REQUEST_ERROR]: 400,
  [ErrorType.INTERNAL_SERVER_ERROR]: 500,
};

/**
 * 기본 AppError 클래스
 */
export class AppErrorBase extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly retryable: boolean;
  public readonly originalError?: Error | unknown;
  public readonly details?: Record<string, unknown>;

  constructor(
    type: ErrorType,
    message: string,
    options?: {
      code?: string;
      retryable?: boolean;
      originalError?: Error | unknown;
      details?: Record<string, unknown>;
      statusCode?: number;
    }
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.statusCode = options?.statusCode ?? ERROR_TYPE_STATUS_CODE[type];
    this.code = options?.code;
    this.retryable = options?.retryable ?? false;
    this.originalError = options?.originalError;
    this.details = options?.details;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppErrorBase);
    }
  }

  toJSON(): AppError {
    return {
      type: this.type,
      message: this.message,
      code: this.code,
      retryable: this.retryable,
      statusCode: this.statusCode,
      originalError: this.originalError,
      details: this.details,
    };
  }
}

/**
 * 데이터베이스 에러
 */
export class DatabaseError extends AppErrorBase {
  constructor(message: string, originalError?: Error | unknown, details?: Record<string, unknown>) {
    super(ErrorType.DATABASE_ERROR, message, {
      retryable: !message.includes('duplicate') && !message.includes('UNIQUE'),
      originalError,
      details,
    });
    this.name = 'DatabaseError';
  }
}

/**
 * API 에러
 */
export class ApiError extends AppErrorBase {
  constructor(message: string, originalError?: Error | unknown, details?: Record<string, unknown>) {
    super(ErrorType.API_ERROR, message, {
      retryable: true,
      originalError,
      details,
    });
    this.name = 'ApiError';
  }
}

/**
 * 검증 에러
 */
export class ValidationError extends AppErrorBase {
  constructor(message: string, details?: Record<string, unknown>) {
    super(ErrorType.VALIDATION_ERROR, message, {
      retryable: false,
      details,
    });
    this.name = 'ValidationError';
  }
}

/**
 * 네트워크 에러
 */
export class NetworkError extends AppErrorBase {
  constructor(message: string, originalError?: Error | unknown, details?: Record<string, unknown>) {
    super(ErrorType.NETWORK_ERROR, message, {
      retryable: true,
      originalError,
      details,
    });
    this.name = 'NetworkError';
  }
}

/**
 * 할당량 초과 에러
 */
export class QuotaExceededError extends AppErrorBase {
  constructor(message: string, originalError?: Error | unknown, details?: Record<string, unknown>) {
    super(ErrorType.QUOTA_EXCEEDED, message, {
      retryable: false,
      originalError,
      details,
    });
    this.name = 'QuotaExceededError';
  }
}

/**
 * 인증 에러
 */
export class AuthError extends AppErrorBase {
  constructor(message: string = '인증이 필요합니다.', details?: Record<string, unknown>) {
    super(ErrorType.AUTH_ERROR, message, {
      retryable: false,
      details,
    });
    this.name = 'AuthError';
  }
}

/**
 * 인가 에러
 */
export class AuthorizationError extends AppErrorBase {
  constructor(message: string = '접근 권한이 없습니다.', details?: Record<string, unknown>) {
    super(ErrorType.AUTHORIZATION_ERROR, message, {
      retryable: false,
      details,
    });
    this.name = 'AuthorizationError';
  }
}

/**
 * 리소스 없음 에러
 */
export class NotFoundError extends AppErrorBase {
  constructor(message: string = '요청한 리소스를 찾을 수 없습니다.', details?: Record<string, unknown>) {
    super(ErrorType.NOT_FOUND_ERROR, message, {
      retryable: false,
      details,
    });
    this.name = 'NotFoundError';
  }
}

/**
 * Rate Limit 에러
 */
export class RateLimitError extends AppErrorBase {
  constructor(message: string = '요청 한도를 초과했습니다.', details?: Record<string, unknown>) {
    super(ErrorType.RATE_LIMIT_ERROR, message, {
      retryable: true,
      details,
    });
    this.name = 'RateLimitError';
  }
}

/**
 * 잘못된 요청 에러
 */
export class BadRequestError extends AppErrorBase {
  constructor(message: string, details?: Record<string, unknown>) {
    super(ErrorType.BAD_REQUEST_ERROR, message, {
      retryable: false,
      details,
    });
    this.name = 'BadRequestError';
  }
}

/**
 * 내부 서버 에러
 */
export class InternalServerError extends AppErrorBase {
  constructor(message: string = '서버 오류가 발생했습니다.', originalError?: Error | unknown, details?: Record<string, unknown>) {
    super(ErrorType.INTERNAL_SERVER_ERROR, message, {
      retryable: true,
      originalError,
      details,
    });
    this.name = 'InternalServerError';
  }
}

/**
 * 에러 타입별 사용자 친화적 메시지
 */
export function getErrorMessage(error: AppError | Error | unknown): string {
  if (error instanceof Error) {
    // 일반 Error 객체인 경우
    // 할당량 초과 에러 우선 확인
    if (error.message.includes('429') ||
        error.message.includes('quota exceeded') ||
        error.message.includes('exceeded your current quota') ||
        error.message.includes('Quota exceeded')) {
      // 재시도 가능 시간 정보 추출 시도
      const retryAfterMatch = error.message.match(/retry in ([\d.]+)s/i) ||
                              error.message.match(/retryDelay["']?\s*:\s*["']?(\d+)/i);
      if (retryAfterMatch) {
        const retryAfter = Math.ceil(parseFloat(retryAfterMatch[1]));
        const minutes = Math.floor(retryAfter / 60);
        const seconds = retryAfter % 60;
        if (minutes > 0) {
          return `Gemini API 할당량을 초과했습니다. ${minutes}분 ${seconds}초 후 다시 시도해주세요.`;
        }
        return `Gemini API 할당량을 초과했습니다. ${retryAfter}초 후 다시 시도해주세요.`;
      }
      return 'Gemini API 일일 할당량을 초과했습니다. 내일 다시 시도해주세요.';
    }
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
      case ErrorType.QUOTA_EXCEEDED:
        return appError.message || 'Gemini API 일일 할당량을 초과했습니다. 내일 다시 시도해주세요.';
      case ErrorType.AUTH_ERROR:
        return appError.message || '인증이 필요합니다. 로그인해주세요.';
      case ErrorType.AUTHORIZATION_ERROR:
        return appError.message || '접근 권한이 없습니다.';
      case ErrorType.NOT_FOUND_ERROR:
        return appError.message || '요청한 리소스를 찾을 수 없습니다.';
      case ErrorType.RATE_LIMIT_ERROR:
        return appError.message || '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
      case ErrorType.BAD_REQUEST_ERROR:
        return appError.message || '잘못된 요청입니다.';
      case ErrorType.INTERNAL_SERVER_ERROR:
        return appError.message || '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      default:
        return appError.message || '알 수 없는 오류가 발생했습니다.';
    }
  }

  return '알 수 없는 오류가 발생했습니다.';
}

/**
 * 에러를 AppError로 변환
 * AppErrorBase 인스턴스인 경우 그대로 반환, 그 외에는 적절한 타입으로 변환
 */
export function toAppError(error: unknown, type: ErrorType = ErrorType.UNKNOWN_ERROR): AppError {
  // 이미 AppErrorBase 인스턴스인 경우
  if (error instanceof AppErrorBase) {
    return error.toJSON();
  }

  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();

    // 할당량 초과 에러 우선 판별
    if (
      errorMessage.includes('429') ||
      errorMessage.includes('quota exceeded') ||
      errorMessage.includes('exceeded your current quota') ||
      errorMessage.includes('quotaexceeded')
    ) {
      return {
        type: ErrorType.QUOTA_EXCEEDED,
        message: error.message,
        originalError: error,
        retryable: false,
        statusCode: ERROR_TYPE_STATUS_CODE[ErrorType.QUOTA_EXCEEDED],
      };
    }

    // Rate Limit 에러 판별
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
      return {
        type: ErrorType.RATE_LIMIT_ERROR,
        message: error.message,
        originalError: error,
        retryable: true,
        statusCode: ERROR_TYPE_STATUS_CODE[ErrorType.RATE_LIMIT_ERROR],
      };
    }

    // 인증 에러 판별
    if (errorMessage.includes('unauthorized') || errorMessage.includes('authentication') || errorMessage.includes('auth')) {
      return {
        type: ErrorType.AUTH_ERROR,
        message: error.message,
        originalError: error,
        retryable: false,
        statusCode: ERROR_TYPE_STATUS_CODE[ErrorType.AUTH_ERROR],
      };
    }

    // 인가 에러 판별
    if (errorMessage.includes('forbidden') || errorMessage.includes('authorization') || errorMessage.includes('permission')) {
      return {
        type: ErrorType.AUTHORIZATION_ERROR,
        message: error.message,
        originalError: error,
        retryable: false,
        statusCode: ERROR_TYPE_STATUS_CODE[ErrorType.AUTHORIZATION_ERROR],
      };
    }

    // 리소스 없음 에러 판별
    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      return {
        type: ErrorType.NOT_FOUND_ERROR,
        message: error.message,
        originalError: error,
        retryable: false,
        statusCode: ERROR_TYPE_STATUS_CODE[ErrorType.NOT_FOUND_ERROR],
      };
    }

    // 잘못된 요청 에러 판별
    if (errorMessage.includes('bad request') || errorMessage.includes('400') || errorMessage.includes('invalid')) {
      return {
        type: ErrorType.BAD_REQUEST_ERROR,
        message: error.message,
        originalError: error,
        retryable: false,
        statusCode: ERROR_TYPE_STATUS_CODE[ErrorType.BAD_REQUEST_ERROR],
      };
    }

    // 데이터베이스 에러 판별
    if (errorMessage.includes('database') || errorMessage.includes('sql') || errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
      return {
        type: ErrorType.DATABASE_ERROR,
        message: error.message,
        originalError: error,
        retryable: !errorMessage.includes('duplicate') && !errorMessage.includes('unique'),
        statusCode: ERROR_TYPE_STATUS_CODE[ErrorType.DATABASE_ERROR],
      };
    }

    // 네트워크 에러 판별
    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
      return {
        type: ErrorType.NETWORK_ERROR,
        message: error.message,
        originalError: error,
        retryable: true,
        statusCode: ERROR_TYPE_STATUS_CODE[ErrorType.NETWORK_ERROR],
      };
    }

    // API 에러 판별
    if (errorMessage.includes('api')) {
      return {
        type: ErrorType.API_ERROR,
        message: error.message,
        originalError: error,
        retryable: true,
        statusCode: ERROR_TYPE_STATUS_CODE[ErrorType.API_ERROR],
      };
    }

    // 기본 타입 사용
    return {
      type,
      message: error.message,
      originalError: error,
      retryable: false,
      statusCode: ERROR_TYPE_STATUS_CODE[type],
    };
  }

  // 알 수 없는 에러 타입
  return {
    type,
    message: String(error),
    originalError: error,
    retryable: false,
    statusCode: ERROR_TYPE_STATUS_CODE[type],
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

