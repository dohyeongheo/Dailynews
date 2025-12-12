'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FetchNewsButton from './FetchNewsButton';

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'title' | 'content' | 'all'>('all');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const params = new URLSearchParams({
        q: searchQuery.trim(),
        type: searchType,
      });
      router.push(`/search?${params.toString()}`);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-2xl">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as 'title' | 'content' | 'all')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              >
                <option value="all">제목 + 내용</option>
                <option value="title">제목</option>
                <option value="content">내용</option>
              </select>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="뉴스 검색..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors"
              >
                검색
              </button>
            </form>
          </div>
          <FetchNewsButton />
        </div>
      </div>
    </header>
  );
}

