'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setMessage({ type: 'error', text: '비밀번호를 입력해주세요.' });
      return;
    }

    setIsLoading(true);
    setMessage({ type: 'info', text: '🔄 뉴스 수집을 시작합니다...' });

    try {
      const response = await fetch('/api/manual/fetch-news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({
          type: 'success',
          text: `✅ ${data.message || '뉴스 수집이 완료되었습니다.'}`,
        });
        // 3초 후 메인 페이지로 이동
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
        setMessage({
          type: 'error',
          text: `❌ ${data.message || '뉴스 수집에 실패했습니다.'}`,
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `❌ 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          뉴스 수동 수집
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900"
              placeholder="비밀번호를 입력하세요"
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '수집 중...' : '뉴스 수집 시작'}
          </button>
        </form>

        {message && (
          <div
            className={`mt-6 p-4 rounded-md ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : message.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}
          >
            <p className="text-sm">{message.text}</p>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            메인 페이지로 돌아가기
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}

