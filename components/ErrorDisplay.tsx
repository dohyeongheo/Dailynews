'use client';

import { AppError, getErrorMessage, isRetryableError } from '@/lib/errors';

interface ErrorDisplayProps {
  error: AppError | Error | unknown;
  onRetry?: () => void;
  showRetry?: boolean;
  className?: string;
}

/**
 * 에러를 사용자 친화적으로 표시하는 컴포넌트
 */
export default function ErrorDisplay({
  error,
  onRetry,
  showRetry = false,
  className = '',
  role = 'alert',
  'aria-live': ariaLive = 'assertive',
}: ErrorDisplayProps) {
  const errorMessage = getErrorMessage(error);
  const canRetry = showRetry && isRetryableError(error) && onRetry;

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">오류가 발생했습니다</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{errorMessage}</p>
          </div>
          {canRetry && (
            <div className="mt-4">
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                다시 시도
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

