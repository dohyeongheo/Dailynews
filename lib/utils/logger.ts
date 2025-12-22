/**
 * 구조화된 로깅 유틸리티
 * Pino를 사용한 로깅 시스템
 */

import pino from 'pino';

// 개발/프로덕션 공통: worker thread(transport)를 사용하지 않는 기본 Pino 설정
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * 로거 인스턴스
 * - Next.js 환경에서 thread-stream 기반 worker를 사용하지 않기 위해
 *   transport(pino-pretty)를 완전히 제거하고 기본 stdout 로깅만 사용합니다.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  base: {
    env: process.env.NODE_ENV,
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
});

/**
 * 로그 레벨 타입
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * 구조화된 로깅 헬퍼
 */
export const log = {
  /**
   * Debug 로그
   */
  debug: (message: string, data?: Record<string, unknown>) => {
    logger.debug(data || {}, message);
  },

  /**
   * Info 로그
   */
  info: (message: string, data?: Record<string, unknown>) => {
    logger.info(data || {}, message);
  },

  /**
   * Warning 로그
   */
  warn: (message: string, data?: Record<string, unknown>) => {
    logger.warn(data || {}, message);
  },

  /**
   * Error 로그
   */
  error: (message: string, error?: Error | unknown, data?: Record<string, unknown>) => {
    if (error instanceof Error) {
      logger.error(
        {
          ...data,
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
        },
        message
      );
    } else {
      logger.error(data || {}, message);
    }
  },

  /**
   * 성능 측정 로그
   */
  performance: (operation: string, durationMs: number, data?: Record<string, unknown>) => {
    logger.info(
      {
        ...data,
        operation,
        durationMs,
        type: 'performance',
      },
      `Performance: ${operation} took ${durationMs}ms`
    );
  },
};

