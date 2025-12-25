/**
 * 클라이언트 사이드 로깅 유틸리티
 * 브라우저 환경에서 사용하는 구조화된 로깅
 */

/**
 * 클라이언트 사이드 로깅 헬퍼
 * 서버 사이드 log 유틸리티와 유사한 인터페이스 제공
 */
export const clientLog = {
  /**
   * Debug 로그
   */
  debug: (message: string, data?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  },

  /**
   * Info 로그
   */
  info: (message: string, data?: Record<string, unknown>) => {
    console.info(`[INFO] ${message}`, data || '');
  },

  /**
   * Warning 로그
   */
  warn: (message: string, data?: Record<string, unknown>) => {
    console.warn(`[WARN] ${message}`, data || '');
  },

  /**
   * Error 로그
   */
  error: (message: string, error?: Error | unknown, data?: Record<string, unknown>) => {
    if (error instanceof Error) {
      console.error(`[ERROR] ${message}`, {
        ...data,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
      });
    } else {
      console.error(`[ERROR] ${message}`, data || '', error);
    }
  },
};

