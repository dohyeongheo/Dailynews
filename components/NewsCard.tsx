"use client";

import Link from "next/link";
import type { News } from "@/types/news";
import { clientLog } from "@/lib/utils/client-logger";
import { useState, useEffect } from "react";

interface NewsCardProps {
  news: News;
  showOriginalLink?: boolean;
}

function NewsCard({ news, showOriginalLink = true }: NewsCardProps) {
  const [viewCount, setViewCount] = useState<number | null>(null);

  useEffect(() => {
    async function loadViewCount() {
      try {
        const res = await fetch(`/api/news/${news.id}/views`);
        if (res.ok) {
          const data = await res.json();
          setViewCount(data.viewCount || 0);
        }
      } catch (error) {
        clientLog.error("Failed to load view count", error instanceof Error ? error : new Error(String(error)), { newsId: news.id });
        setViewCount(0);
      }
    }

    loadViewCount();
  }, [news.id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // 카테고리별 색상 매핑
  const getCategoryColor = (category: string | null) => {
    if (!category) return "bg-gray-100 text-gray-700";

    const colorMap: Record<string, string> = {
      정치: "bg-red-100 text-red-700 border-red-200",
      경제: "bg-blue-100 text-blue-700 border-blue-200",
      사회: "bg-green-100 text-green-700 border-green-200",
      과학: "bg-purple-100 text-purple-700 border-purple-200",
      스포츠: "bg-orange-100 text-orange-700 border-orange-200",
      문화: "bg-pink-100 text-pink-700 border-pink-200",
      기술: "bg-indigo-100 text-indigo-700 border-indigo-200",
      건강: "bg-teal-100 text-teal-700 border-teal-200",
      환경: "bg-emerald-100 text-emerald-700 border-emerald-200",
      국제: "bg-cyan-100 text-cyan-700 border-cyan-200",
      기타: "bg-gray-100 text-gray-700 border-gray-200",
    };

    return colorMap[category] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <article className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <Link href={`/news/${news.id}`} className="block p-4 sm:p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {news.news_category && (
                <Link
                  href={`/topic/${encodeURIComponent(news.news_category)}`}
                  onClick={(e) => e.stopPropagation()}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${getCategoryColor(news.news_category)} hover:opacity-80 transition-opacity cursor-pointer`}
                >
                  {news.news_category}
                </Link>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
              {news.title}
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
              <span className="font-medium text-blue-600">{news.source_media}</span>
              <span>•</span>
              <span>{formatDate(news.published_date)}</span>
            </div>
          </div>
        </div>

        <p className="text-sm sm:text-base text-gray-700 mb-4 whitespace-pre-wrap break-words leading-relaxed">
          {news.content_translated || news.content}
        </p>

        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
          <div className="flex items-center gap-4">
            {viewCount !== null && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                조회수 {viewCount.toLocaleString()}
              </span>
            )}
          </div>
          {showOriginalLink && news.original_link && news.original_link.trim() !== "" ? (
            <a
              href={news.original_link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
            >
              원문 보기
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ) : null}
        </div>
      </Link>
    </article>
  );
}

export default NewsCard;
