/**
 * Sentry 통합 유틸리티
 * AI 에이전트가 사용할 수 있는 Sentry 헬퍼 함수들
 */

import * as Sentry from '@sentry/nextjs';
import type { AppError } from '@/lib/errors';

/**
 * Sentry가 초기화되었는지 확인
 */
export function isSentryEnabled(): boolean {
  return typeof process.env.NEXT_PUBLIC_SENTRY_DSN !== 'undefined' ||
         typeof process.env.SENTRY_DSN !== 'undefined';
}

/**
 * 컨텍스트와 함께 에러를 Sentry에 캡처
 */
export function captureErrorWithContext(
  error: Error | unknown,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    user?: {
      id?: string;
      email?: string;
      username?: string;
    };
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  }
): string | undefined {
  if (!isSentryEnabled()) {
    return undefined;
  }

  try {
    const errorToCapture = error instanceof Error ? error : new Error(String(error));

    const eventId = Sentry.captureException(errorToCapture, {
      tags: context?.tags,
      extra: context?.extra,
      level: context?.level || 'error',
      user: context?.user,
    });

    return eventId;
  } catch (sentryError) {
    console.warn('[Sentry Helper] Failed to capture error:', sentryError);
    return undefined;
  }
}

/**
 * AppError를 Sentry에 캡처
 */
export function captureAppError(
  appError: AppError,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  }
): string | undefined {
  if (!isSentryEnabled()) {
    return undefined;
  }

  try {
    const error = appError.originalError instanceof Error
      ? appError.originalError
      : new Error(appError.message);

    return Sentry.captureException(error, {
      tags: {
        errorType: appError.type,
        errorCode: appError.code || appError.type,
        statusCode: String(appError.statusCode || 500),
        retryable: String(appError.retryable || false),
        ...context?.tags,
      },
      extra: {
        appError: {
          type: appError.type,
          message: appError.message,
          code: appError.code,
          retryable: appError.retryable,
          statusCode: appError.statusCode,
        },
        ...appError.details,
        ...context?.extra,
      },
    });
  } catch (sentryError) {
    console.warn('[Sentry Helper] Failed to capture app error:', sentryError);
    return undefined;
  }
}

/**
 * Sentry 사용자 정보 설정
 */
export function setSentryUser(user: {
  id?: string;
  email?: string;
  username?: string;
  ip_address?: string;
}): void {
  if (!isSentryEnabled()) {
    return;
  }

  try {
    Sentry.setUser(user);
  } catch (sentryError) {
    console.warn('[Sentry Helper] Failed to set user:', sentryError);
  }
}

/**
 * Sentry 사용자 정보 초기화
 */
export function clearSentryUser(): void {
  if (!isSentryEnabled()) {
    return;
  }

  try {
    Sentry.setUser(null);
  } catch (sentryError) {
    console.warn('[Sentry Helper] Failed to clear user:', sentryError);
  }
}

/**
 * 디버깅을 위한 브레드크럼 추가
 */
export function addSentryBreadcrumb(
  message: string,
  category?: string,
  level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info',
  data?: Record<string, unknown>
): void {
  if (!isSentryEnabled()) {
    return;
  }

  try {
    Sentry.addBreadcrumb({
      message,
      category: category || 'custom',
      level,
      data,
      timestamp: Date.now() / 1000,
    });
  } catch (sentryError) {
    console.warn('[Sentry Helper] Failed to add breadcrumb:', sentryError);
  }
}

/**
 * Sentry 이슈 URL 생성
 */
export function getSentryIssueUrl(issueId: string): string | null {
  const org = process.env.SENTRY_ORG;
  const project = process.env.SENTRY_PROJECT;
  const region = process.env.SENTRY_REGION || 'us';

  if (!org || !project) {
    return null;
  }

  const baseUrl = region === 'us'
    ? 'https://sentry.io'
    : `https://${region}.sentry.io`;

  return `${baseUrl}/organizations/${org}/issues/${issueId}/`;
}

/**
 * Sentry 프로젝트 URL 생성
 */
export function getSentryProjectUrl(): string | null {
  const org = process.env.SENTRY_ORG;
  const project = process.env.SENTRY_PROJECT;
  const region = process.env.SENTRY_REGION || 'us';

  if (!org || !project) {
    return null;
  }

  const baseUrl = region === 'us'
    ? 'https://sentry.io'
    : `https://${region}.sentry.io`;

  return `${baseUrl}/organizations/${org}/projects/${project}/`;
}

/**
 * Sentry 컨텍스트 설정
 */
export function setSentryContext(
  name: string,
  context: Record<string, unknown>
): void {
  if (!isSentryEnabled()) {
    return;
  }

  try {
    Sentry.setContext(name, context);
  } catch (sentryError) {
    console.warn('[Sentry Helper] Failed to set context:', sentryError);
  }
}

/**
 * Sentry 태그 설정
 */
export function setSentryTag(key: string, value: string): void {
  if (!isSentryEnabled()) {
    return;
  }

  try {
    Sentry.setTag(key, value);
  } catch (sentryError) {
    console.warn('[Sentry Helper] Failed to set tag:', sentryError);
  }
}

/**
 * Sentry 태그들 일괄 설정
 */
export function setSentryTags(tags: Record<string, string>): void {
  if (!isSentryEnabled()) {
    return;
  }

  try {
    Object.entries(tags).forEach(([key, value]) => {
      Sentry.setTag(key, value);
    });
  } catch (sentryError) {
    console.warn('[Sentry Helper] Failed to set tags:', sentryError);
  }
}

/**
 * Sentry 트랜잭션 시작
 * Note: Sentry v7+에서는 startSpan을 사용합니다.
 * 이 함수는 호환성을 위해 유지하되, 실제 사용 시 Sentry.startSpan을 직접 사용하는 것을 권장합니다.
 */
export function startSentryTransaction(
  name: string,
  op: string,
  description?: string
): any | null {
  if (!isSentryEnabled()) {
    return null;
  }

  try {
    // Sentry v7+에서는 startSpan을 사용
    // 이 함수는 호환성을 위해 유지하되, 실제 사용 시 startSpan을 권장합니다.
    if (typeof Sentry.startSpan === 'function') {
      const spanOptions: { name: string; op: string; attributes?: Record<string, string> } = {
        name,
        op,
      };

      if (description) {
        spanOptions.attributes = { description };
      }

      return Sentry.startSpan(spanOptions, () => {
        // Span이 활성화된 상태에서 실행될 코드
        // 실제 사용 시 이 콜백 내에서 작업을 수행해야 합니다.
      });
    }

    // 구버전 호환성
    if (typeof (Sentry as any).startTransaction === 'function') {
      return (Sentry as any).startTransaction({
        name,
        op,
        description,
      });
    }

    return null;
  } catch (sentryError) {
    console.warn('[Sentry Helper] Failed to start transaction:', sentryError);
    return null;
  }
}

/**
 * 메시지만 Sentry에 전송 (에러가 아닌 정보성 메시지)
 */
export function captureSentryMessage(
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info',
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  }
): string | undefined {
  if (!isSentryEnabled()) {
    return undefined;
  }

  try {
    // Sentry v7+에서는 captureMessage의 시그니처가 변경됨
    return Sentry.captureMessage(message, {
      level,
      tags: context?.tags,
      extra: context?.extra,
    });
  } catch (sentryError) {
    console.warn('[Sentry Helper] Failed to capture message:', sentryError);
    return undefined;
  }
}

