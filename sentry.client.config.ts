/**
 * Sentry 클라이언트 사이드 설정
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

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
    // 브라우저 확장 프로그램 에러
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],

  // 필터링할 URL
  denyUrls: [
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
  ],

  // 초기화 옵션
  beforeSend(event, hint) {
    // 개발 환경에서는 콘솔에 출력
    if (process.env.NODE_ENV === 'development') {
      console.error('[Sentry] Error captured:', event);
    }
    return event;
  },
});

