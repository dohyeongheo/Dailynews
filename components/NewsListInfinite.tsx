'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getNewsByCategoryPaginatedAction } from '@/lib/actions';
import NewsCard from './NewsCard';
import ErrorDisplay from './ErrorDisplay';
import type { News, NewsCategory } from '@/types/news';

interface NewsListInfiniteProps {
  category: NewsCategory;
  initialNews: News[];
  initialHasMore: boolean;
}

const PAGE_SIZE = 12;

export default function NewsListInfinite({ category, initialNews, initialHasMore }: NewsListInfiniteProps) {
  const [news, setNews] = useState<News[]>(initialNews);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getNewsByCategoryPaginatedAction(category, page + 1, PAGE_SIZE);

      if (result.success && result.data) {
        setNews((prev) => [...prev, ...result.data!]);
        setHasMore(result.hasMore);
        setPage((prev) => prev + 1);
      } else {
        setError(result.error || '뉴스를 불러오는 중 오류가 발생했습니다.');
        setHasMore(false);
      }
    } catch (err) {
      setError('뉴스를 불러오는 중 오류가 발생했습니다.');
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [category, page, loading, hasMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, loadMore]);

  if (error && news.length === 0) {
    return <ErrorDisplay error={error} />;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {news.map((item) => (
          <NewsCard key={item.id} news={item} showOriginalLink={false} />
        ))}
      </div>

      {/* 무한 스크롤 트리거 */}
      {hasMore && (
        <div ref={observerTarget} className="mt-8 flex justify-center">
          {loading && (
            <div className="flex items-center gap-2 text-gray-600">
              <svg
                className="animate-spin h-5 w-5"
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
              <span className="text-sm">뉴스를 불러오는 중...</span>
            </div>
          )}
        </div>
      )}

      {!hasMore && news.length > 0 && (
        <div className="mt-8 text-center text-sm text-gray-500">
          모든 뉴스를 불러왔습니다.
        </div>
      )}

      {error && news.length > 0 && (
        <div className="mt-4">
          <ErrorDisplay error={error} onRetry={loadMore} showRetry={true} />
        </div>
      )}
    </>
  );
}

