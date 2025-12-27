"use client";

import Link from "next/link";
import CategoryBadge from "@/components/CategoryBadge";
import type { News } from "@/types/news";
import HighlightedText from "./HighlightedText";

interface SearchResultCardProps {
  news: News;
  query: string;
  searchType: "title" | "content" | "all";
}

import { formatNewsDateDetailed } from "@/lib/utils/date-format";

export default function SearchResultCard({ news, query, searchType }: SearchResultCardProps) {

  // 카테고리별 색상 매핑
  const getCategoryColor = (category: string | null) => {
    if (!category) return "bg-gray-100 text-gray-700 border-gray-200";

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
    <article
      className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6"
      aria-label={`${news.category}${news.news_category ? ` - ${news.news_category}` : ""} 뉴스: ${news.title}`}
    >
      <div className="mb-2 sm:mb-3">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <CategoryBadge category={news.category} type="main" className="text-xs px-2.5 py-1" />
          {news.news_category && (
            <CategoryBadge category={news.news_category} type="topic" className="text-xs px-2.5 py-1" />
          )}
        </div>
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
          <span className="text-gray-400">•</span>
          <span>{news.source_country}</span>
          <span className="text-gray-400">•</span>
          <span>{news.source_media}</span>
        </div>
        <time dateTime={news.published_date} className="text-gray-400">
          {formatNewsDateDetailed(news.published_date)}
        </time>
      </div>
    </article>
  );
}
