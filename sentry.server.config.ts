/**
 * Sentry 서버 사이드 설정
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 환경별 설정
  environment: process.env.NODE_ENV || 'development',

  // 성능 모니터링
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // 에러 샘플링
  sampleRate: 1.0,

  // 릴리스 추적
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,

  // 무시할 에러
  ignoreErrors: [
    // Vercel 관련 에러
    'ECONNRESET',
    'ECONNREFUSED',
  ],

  // 초기화 옵션
  beforeSend(event, hint) {
    // 개발 환경에서는 콘솔에 출력
    if (process.env.NODE_ENV === 'development') {
      console.error('[Sentry] Server error captured:', event);
    }
    return event;
  },
});

