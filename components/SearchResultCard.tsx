"use client";

import Link from "next/link";
import type { News } from "@/types/news";
import HighlightedText from "./HighlightedText";

interface SearchResultCardProps {
  news: News;
  query: string;
  searchType: "title" | "content" | "all";
}

export default function SearchResultCard({ news, query, searchType }: SearchResultCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}년 ${month}월 ${day}일 ${hours}시 ${minutes}분`;
  };

  return (
    <article
      className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6"
      aria-label={`${news.category}${news.news_category ? ` - ${news.news_category}` : ""} 뉴스: ${news.title}`}
    >
      <div className="mb-2 sm:mb-3">
        <Link href={`/news/${news.id}`} className="block group-hover:text-blue-600 transition-colors">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2" aria-label="뉴스 제목">
            {(searchType === "title" || searchType === "all") && query ? (
              <HighlightedText text={news.title} query={query} />
            ) : (
              news.title
            )}
          </h3>
        </Link>
      </div>

      <Link href={`/news/${news.id}`} className="block">
        <p
          className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4 whitespace-pre-wrap break-words leading-relaxed hover:text-gray-900"
          aria-label="뉴스 내용"
        >
          {(searchType === "content" || searchType === "all") && query ? (
            <HighlightedText text={news.content_translated || news.content} query={query} />
          ) : (
            news.content_translated || news.content
          )}
        </p>
      </Link>

      <div className="flex items-center justify-between text-xs text-gray-500 gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">{news.category}</span>
          {news.news_category && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{news.news_category}</span>
          )}
          <span className="text-gray-400">•</span>
          <span>{news.source_country}</span>
          <span className="text-gray-400">•</span>
          <span>{news.source_media}</span>
        </div>
        <time dateTime={news.published_date} className="text-gray-400">
          {formatDate(news.published_date)}
        </time>
      </div>
    </article>
  );
}
