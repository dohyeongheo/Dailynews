/**
 * 앱 시작 시 환경 변수 검증
 * 이 파일은 서버 사이드에서만 실행됩니다.
 */

import { initEnv } from './env';

/**
 * 서버 사이드 환경 변수 검증
 * Next.js 앱이 시작될 때 자동으로 실행됩니다.
 */
if (typeof window === 'undefined') {
  try {
    initEnv();
  } catch (error) {
    // 환경 변수 검증 실패 시 앱 시작을 중단하지 않고 경고만 표시
    // (개발 환경에서는 더 명확한 에러 메시지)
    if (process.env.NODE_ENV === 'development') {
      console.error('='.repeat(80));
      console.error('환경 변수 검증 실패!');
      console.error('='.repeat(80));
      console.error(error);
      console.error('='.repeat(80));
    } else {
      console.error('[Env] 환경 변수 검증 실패:', error instanceof Error ? error.message : String(error));
    }
  }
}

