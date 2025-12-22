"use client";

import { memo, useState, useEffect } from "react";
import Link from "next/link";
import type { News } from "@/types/news";

interface NewsCardProps {
  news: News;
  showOriginalLink?: boolean;
  initialBookmarked?: boolean;
}

function NewsCard({ news, showOriginalLink = true, initialBookmarked = false }: NewsCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [viewCount, setViewCount] = useState<number | null>(null);

  // 초기 북마크 상태 및 조회수 확인
  useEffect(() => {
    async function checkBookmarkStatus() {
      try {
        // 세션 확인
        const sessionRes = await fetch("/api/auth/session");
        if (sessionRes.ok) {
          const session = await sessionRes.json();
          if (session?.user) {
            setIsLoggedIn(true);

            // 북마크 상태 확인
            const bookmarkRes = await fetch(`/api/bookmarks/check?newsId=${news.id}`);
            if (bookmarkRes.ok) {
              const data = await bookmarkRes.json();
              setIsBookmarked(data.isBookmarked || false);
            }
          }
        }
      } catch (error) {
        console.error("Failed to check bookmark status:", error);
      }
    }

    async function loadViewCount() {
      try {
        const res = await fetch(`/api/news/${news.id}/views`);
        if (res.ok) {
          const data = await res.json();
          setViewCount(data.viewCount || 0);
        }
      } catch (error) {
        console.error("Failed to load view count:", error);
        setViewCount(0);
      }
    }

    checkBookmarkStatus();
    loadViewCount();
  }, [news.id]);

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!isLoggedIn) {
      alert("북마크 기능을 사용하려면 로그인이 필요합니다.");
      return;
    }

    try {
      const method = isBookmarked ? "DELETE" : "POST";
      const url = isBookmarked ? `/api/bookmarks?newsId=${news.id}` : "/api/bookmarks";

      const body = isBookmarked ? undefined : JSON.stringify({ newsId: news.id });

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (res.ok) {
        setIsBookmarked(!isBookmarked);
      } else if (res.status === 401) {
        setIsLoggedIn(false);
        alert("북마크 기능을 사용하려면 로그인이 필요합니다.");
      } else {
        const data = await res.json();
        alert(data.error || "북마크 처리 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("Bookmark toggle error:", error);
      alert("북마크 처리 중 오류가 발생했습니다.");
    }
  };

  const formatDate = (dateString: string) => {
    // created_at은 UTC로 저장되어 있으므로, 태국 시간대(Asia/Bangkok, UTC+7)로 변환
    const date = new Date(dateString);

    // Intl.DateTimeFormat을 사용하여 태국 시간대로 변환
    const formatter = new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const year = parts.find((p) => p.type === "year")?.value || "";
    const month = parts.find((p) => p.type === "month")?.value || "";
    const day = parts.find((p) => p.type === "day")?.value || "";
    const hours = parts.find((p) => p.type === "hour")?.value || "";
    const minutes = parts.find((p) => p.type === "minute")?.value || "";

    return `${year}년 ${month}월 ${day}일 ${hours}시 ${minutes}분`;
  };

  return (
    <article
      className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6 relative group"
      aria-label={`${news.category}${news.news_category ? ` - ${news.news_category}` : ""} 뉴스: ${news.title}`}
    >
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="flex-1 min-w-0 pr-8">
          {/* 상단 태그/출처 영역 제거 (카드 상단에 카테고리/출처 표시하지 않음) */}

          <Link href={`/news/${news.id}`} className="block group-hover:text-blue-600 transition-colors">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2" aria-label="뉴스 제목">
              {news.title}
            </h3>
          </Link>
        </div>

        {/* 북마크 버튼 */}
        <button
          onClick={toggleBookmark}
          className={`absolute top-6 right-6 p-1 rounded-full hover:bg-gray-100 transition-colors ${isBookmarked ? "text-yellow-500" : "text-gray-300"}`}
          aria-label="북마크"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={isBookmarked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>

      <Link href={`/news/${news.id}`} className="block">
        <p
          className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4 whitespace-pre-wrap break-words leading-relaxed hover:text-gray-900"
          aria-label="뉴스 내용"
        >
          {news.content_translated || news.content}
        </p>
      </Link>

      <div className="flex items-center justify-between text-xs text-gray-500 gap-2">
        <div className="flex items-center gap-2">
          {news.news_category && (
            <span className="px-2 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full bg-purple-100 text-purple-800">
              {news.news_category}
            </span>
          )}
          {viewCount !== null && (
            <span className="flex items-center gap-1 whitespace-nowrap">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              조회수 {viewCount.toLocaleString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {showOriginalLink && news.original_link && news.original_link !== "#" ? (
            <a
              href={news.original_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap flex-shrink-0"
            >
              원문 보기 →
            </a>
          ) : null}
          <time dateTime={news.created_at} className="whitespace-nowrap" aria-label="뉴스 생성 시간">
            {formatDate(news.created_at)}
          </time>
        </div>
      </div>
    </article>
  );
}

// React.memo로 불필요한 리렌더링 방지
export default memo(NewsCard);
