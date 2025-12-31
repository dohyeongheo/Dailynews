/**
 * Sentry 클라이언트 사이드 설정 (Turbopack 지원)
 *
 * Next.js 15+ 및 Turbopack 사용 시 필수입니다.
 * 기존 sentry.client.config.ts를 대체합니다.
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
      console.error('[Sentry] Error captured:', {
        message: event.message,
        level: event.level,
        tags: event.tags,
        extra: event.extra,
        contexts: event.contexts,
        breadcrumbs: event.breadcrumbs?.slice(-5), // 최근 5개 브레드크럼만
      });
    }

    // AI 에이전트 분석을 위한 추가 메타데이터
    if (!event.tags) {
      event.tags = {};
    }

    // 에러 타입 분류 태그 추가
    if (event.exception?.values?.[0]) {
      const exception = event.exception.values[0];
      event.tags.errorType = exception.type || 'Unknown';
      event.tags.errorValue = exception.value?.substring(0, 100) || 'Unknown';

      // 스택 트레이스에서 파일 정보 추출
      if (exception.stacktrace?.frames) {
        const frames = exception.stacktrace.frames;
        const lastFrame = frames[frames.length - 1];
        if (lastFrame?.filename) {
          event.tags.sourceFile = lastFrame.filename;
          event.tags.sourceLine = String(lastFrame.lineno || 'unknown');
        }
      }
    }

    // 추가 컨텍스트 정보
    if (!event.contexts) {
      event.contexts = {};
    }

    event.contexts.runtime = {
      name: 'browser',
      version: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    };

    // 개발 환경에서 더 상세한 정보 수집
    if (process.env.NODE_ENV === 'development') {
      event.extra = {
        ...event.extra,
        developmentMode: true,
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      };
    }

    return event;
  },
});

/**
 * Router 전환 추적
 * Next.js App Router의 네비게이션을 자동으로 추적합니다.
 */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

