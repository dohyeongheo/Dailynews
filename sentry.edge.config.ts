/**
 * Sentry Edge Runtime 설정
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 환경별 설정
  environment: process.env.NODE_ENV || 'development',

  // 성능 모니터링 (Edge는 낮은 샘플링)
  tracesSampleRate: 0.1,

  // 에러 샘플링
  sampleRate: 1.0,
});

