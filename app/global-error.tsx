/**
 * Global Error Boundary
 * App Router에서 발생하는 React 렌더링 에러를 캡처합니다.
 *
 * Next.js App Router의 global-error.tsx 컨벤션을 사용합니다.
 */

'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import ErrorDisplay from '@/components/ErrorDisplay';
import { toAppError, ErrorType } from '@/lib/errors';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Sentry에 에러 전송
    Sentry.captureException(error, {
      tags: {
        errorBoundary: 'global-error',
        digest: error.digest,
      },
      contexts: {
        react: {
          componentStack: error.stack,
        },
      },
    });
  }, [error]);

  const appError = toAppError(error, ErrorType.UNKNOWN_ERROR);

  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <ErrorDisplay
              error={appError}
              onRetry={reset}
              showRetry={true}
              className="bg-white rounded-lg shadow-lg p-6"
            />
          </div>
        </div>
      </body>
    </html>
  );
}

