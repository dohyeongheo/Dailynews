'use client';

import { useState, useCallback } from 'react';
import { fetchAndSaveNewsAction } from '@/lib/actions';
import ToastContainer, { type Toast } from './Toast';

export default function FetchNewsButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: Toast['type'], message: string, duration?: number) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, type, message, duration };
    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const handleFetchNews = async () => {
    setIsLoading(true);
    setToasts([]);

    const toastIds: string[] = [];

    try {
      // 단계 1: 뉴스 수집 시작
      const startId = addToast('info', '🔄 뉴스 수집을 시작합니다...', 0);
      toastIds.push(startId);

      // 단계 2: API 호출 중
      setTimeout(() => {
        const apiId = addToast('info', '📡 Google Gemini API에서 뉴스를 가져오는 중...', 0);
        toastIds.push(apiId);
      }, 300);

      // 실제 뉴스 수집 작업 실행 (비동기로 실행되므로 진행 상황은 추정)
      const fetchPromise = fetchAndSaveNewsAction();

      // 단계 3: 번역 진행 중 (API 응답 후 자동으로 번역이 수행됨)
      setTimeout(() => {
        const translateId = addToast('info', '🔄 한국어 번역을 진행하는 중...', 0);
        toastIds.push(translateId);
      }, 2000);

      // 단계 4: 데이터베이스 저장 중
      setTimeout(() => {
        const saveId = addToast('info', '💾 데이터베이스에 저장하는 중...', 0);
        toastIds.push(saveId);
      }, 4000);

      // 결과 대기
      const result = await fetchPromise;

      // 모든 진행 중 토스트 제거
      toastIds.forEach((id) => removeToast(id));
      setToasts([]);

      if (result.success) {
        // 완료 메시지
        addToast('success', `✅ ${result.data?.total || 0}개의 뉴스 중 ${result.data?.success || 0}개가 성공적으로 저장되었습니다.`, 4000);

        // 성공 시 페이지 새로고침 (뉴스 목록 업데이트)
        setTimeout(() => {
          window.location.reload();
        }, 4000);
      } else {
        addToast('error', `❌ 오류: ${result.message}`, 5000);
      }
    } catch (error) {
      // 모든 진행 중 토스트 제거
      toastIds.forEach((id) => removeToast(id));
      setToasts([]);

      const errorMessage = error instanceof Error ? error.message : '뉴스 수집 중 오류가 발생했습니다.';
      addToast('error', `❌ 오류: ${errorMessage}`, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-4">
        <button
          onClick={handleFetchNews}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              수집 중...
            </>
          ) : (
            '뉴스 수집'
          )}
        </button>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}

