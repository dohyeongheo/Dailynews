'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import ErrorDisplay from './ErrorDisplay';
import { toAppError, ErrorType } from '@/lib/errors';
import { clientLog } from '@/lib/utils/client-logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary 컴포넌트
 * 컴포넌트 트리에서 발생한 에러를 캐치하여 사용자에게 표시
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Sentry에 에러 전송
    if (typeof window !== 'undefined') {
      try {
        const Sentry = require('@sentry/nextjs');
        Sentry.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo.componentStack,
            },
          },
        });
      } catch (sentryError) {
        // Sentry 초기화 실패 시 무시
        clientLog.warn('Sentry capture failed', { sentryError });
      }
    }

    // 에러 로깅 (프로덕션 환경에서는 에러 추적 서비스로 전송)
    clientLog.error('ErrorBoundary caught an error', error, { errorInfo });

    // 개발 환경에서만 상세 정보 표시
    if (process.env.NODE_ENV === 'development') {
      clientLog.error('Error details', error, {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const appError = toAppError(this.state.error, ErrorType.UNKNOWN_ERROR);

      return (
        <ErrorDisplay
          error={appError}
          onRetry={this.handleReset}
          showRetry={true}
        />
      );
    }

    return this.props.children;
  }
}

