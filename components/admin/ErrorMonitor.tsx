"use client";

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ToastProvider';
import { clientLog } from '@/lib/utils/client-logger';
import type { ConsoleMessage } from '@/lib/utils/browser-automation';

interface ErrorMonitorProps {
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

interface ConsoleErrorData {
  total: number;
  errors: number;
  warnings: number;
  infos: number;
  messages: ConsoleMessage[];
  errorLocations: Array<{
    message: string;
    source: string;
    line: number | null;
    column: number | null;
    stack?: string;
  }>;
  relatedFiles: string[];
}

export default function ErrorMonitor({ autoRefresh = true, refreshInterval = 5000 }: ErrorMonitorProps) {
  const { showError, showSuccess } = useToast();
  const [errorData, setErrorData] = useState<ConsoleErrorData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [clientErrors, setClientErrors] = useState<ConsoleMessage[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // 클라이언트 사이드 콘솔 에러 캡처
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalError = console.error;
    const originalWarn = console.warn;

    const capturedErrors: ConsoleMessage[] = [];

    console.error = (...args: unknown[]) => {
      originalError.apply(console, args);
      const message = args.map((arg) => String(arg)).join(' ');
      capturedErrors.push({
        level: 'error',
        message,
        timestamp: Date.now(),
        source: window.location.href,
      });
      setClientErrors([...capturedErrors]);
    };

    console.warn = (...args: unknown[]) => {
      originalWarn.apply(console, args);
      const message = args.map((arg) => String(arg)).join(' ');
      capturedErrors.push({
        level: 'warning',
        message,
        timestamp: Date.now(),
        source: window.location.href,
      });
      setClientErrors([...capturedErrors]);
    };

    // 전역 에러 핸들러
    const handleError = (event: ErrorEvent) => {
      capturedErrors.push({
        level: 'error',
        message: event.message || 'Unknown error',
        timestamp: Date.now(),
        source: event.filename || window.location.href,
        stack: event.error?.stack,
      });
      setClientErrors([...capturedErrors]);
    };

    // Promise rejection 핸들러
    const handleRejection = (event: PromiseRejectionEvent) => {
      capturedErrors.push({
        level: 'error',
        message: event.reason?.message || String(event.reason) || 'Unhandled promise rejection',
        timestamp: Date.now(),
        source: window.location.href,
        stack: event.reason?.stack,
      });
      setClientErrors([...capturedErrors]);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    setIsMonitoring(true);

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
      setIsMonitoring(false);
    };
  }, []);

  // 서버에서 콘솔 에러 조회
  const fetchConsoleErrors = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/console-errors', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('콘솔 에러 조회 실패');
      }

      const data = await response.json();
      if (data.success) {
        setErrorData(data.data);
      }
    } catch (error) {
      clientLog.error('콘솔 에러 조회 실패', error);
      showError('콘솔 에러를 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  // 클라이언트 에러를 서버로 전송
  const sendClientErrors = useCallback(async () => {
    if (clientErrors.length === 0) return;

    try {
      const response = await fetch('/api/admin/console-errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          messages: clientErrors,
        }),
      });

      if (response.ok) {
        clientLog.debug('클라이언트 에러 전송 성공', { count: clientErrors.length });
      }
    } catch (error) {
      clientLog.warn('클라이언트 에러 전송 실패', { error: error instanceof Error ? error.message : String(error) });
    }
  }, [clientErrors]);

  // 초기 로드 및 자동 새로고침
  useEffect(() => {
    fetchConsoleErrors();
    sendClientErrors();

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchConsoleErrors();
        sendClientErrors();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchConsoleErrors, sendClientErrors]);

  // Sentry와 통합 (선택사항)
  useEffect(() => {
    if (errorData && errorData.errors > 0) {
      // Sentry에 에러 전송 (Sentry가 설정된 경우)
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        errorData.messages
          .filter((m) => m.level === 'error')
          .forEach((error) => {
            (window as any).Sentry.captureException(new Error(error.message), {
              tags: {
                source: 'console',
                component: 'ErrorMonitor',
              },
              extra: {
                source: error.source,
                stack: error.stack,
              },
            });
          });
      }
    }
  }, [errorData]);

  if (!isMonitoring && !errorData && !isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center text-gray-500">에러 모니터링 초기화 중...</div>
      </div>
    );
  }

  const totalErrors = (errorData?.errors || 0) + clientErrors.filter((e) => e.level === 'error').length;
  const totalWarnings = (errorData?.warnings || 0) + clientErrors.filter((e) => e.level === 'warning').length;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">콘솔 에러 모니터링</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-sm text-gray-600">
              {isMonitoring ? '모니터링 중' : '중지됨'}
            </span>
          </div>
          <button
            onClick={fetchConsoleErrors}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '새로고침 중...' : '새로고침'}
          </button>
        </div>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm font-medium text-red-800">에러</div>
          <div className="text-2xl font-bold text-red-900">{totalErrors}</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-sm font-medium text-yellow-800">경고</div>
          <div className="text-2xl font-bold text-yellow-900">{totalWarnings}</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm font-medium text-blue-800">정보</div>
          <div className="text-2xl font-bold text-blue-900">{errorData?.infos || 0}</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-800">전체</div>
          <div className="text-2xl font-bold text-gray-900">
            {(errorData?.total || 0) + clientErrors.length}
          </div>
        </div>
      </div>

      {/* 클라이언트 에러 목록 */}
      {clientErrors.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">클라이언트 에러 ({clientErrors.length})</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {clientErrors.map((error, index) => (
              <div
                key={index}
                className={`p-3 rounded-md ${
                  error.level === 'error'
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-yellow-50 border border-yellow-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{error.message}</div>
                    {error.source && (
                      <div className="text-xs text-gray-500 mt-1">출처: {error.source}</div>
                    )}
                    {error.stack && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer">스택 트레이스</summary>
                        <pre className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{error.stack}</pre>
                      </details>
                    )}
                  </div>
                  <span
                    className={`ml-2 px-2 py-1 text-xs font-medium rounded ${
                      error.level === 'error'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {error.level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 서버 에러 목록 */}
      {errorData && errorData.messages.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">서버 에러 ({errorData.messages.length})</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {errorData.messages.map((error, index) => (
              <div
                key={index}
                className={`p-3 rounded-md ${
                  error.level === 'error'
                    ? 'bg-red-50 border border-red-200'
                    : error.level === 'warning'
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-blue-50 border border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{error.message}</div>
                    {error.source && (
                      <div className="text-xs text-gray-500 mt-1">출처: {error.source}</div>
                    )}
                    {error.stack && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer">스택 트레이스</summary>
                        <pre className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{error.stack}</pre>
                      </details>
                    )}
                  </div>
                  <span
                    className={`ml-2 px-2 py-1 text-xs font-medium rounded ${
                      error.level === 'error'
                        ? 'bg-red-100 text-red-800'
                        : error.level === 'warning'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {error.level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 에러 위치 정보 */}
      {errorData && errorData.errorLocations.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">에러 발생 위치</h3>
          <div className="space-y-2">
            {errorData.errorLocations.map((location, index) => (
              <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <div className="text-sm font-medium text-gray-900">{location.message}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {location.source}
                  {location.line && `:${location.line}${location.column ? `:${location.column}` : ''}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 관련 파일 */}
      {errorData && errorData.relatedFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">관련 파일</h3>
          <div className="space-y-1">
            {errorData.relatedFiles.map((file, index) => (
              <div key={index} className="text-sm text-gray-600 font-mono">
                {file}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 에러 없음 */}
      {totalErrors === 0 && totalWarnings === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">✅</div>
          <div>에러가 없습니다.</div>
        </div>
      )}
    </div>
  );
}

