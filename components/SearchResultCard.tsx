"use client";

import Link from "next/link";
import type { News } from "@/types/news";
import HighlightedText from "./HighlightedText";

interface SearchResultCardProps {
  news: News;
  query: string;
  searchType: "title" | "content" | "all";
}

/**
 * 검색 결과 전용 카드
 * - 제목/내용에서 검색어를 하이라이트하여 보여줌
 */
export default function SearchResultCard({ news, query, searchType }: SearchResultCardProps) {
  // 어떤 필드에 하이라이트를 적용할지 결정
  const shouldHighlightTitle = searchType === "title" || searchType === "all";
  const shouldHighlightContent = searchType === "content" || searchType === "all";

  const contentText = news.content_translated || news.content;

  return (
    <article className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6 relative group">
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="flex-1 min-w-0 pr-2 sm:pr-4">
          <Link href={`/news/${news.id}`} className="block group-hover:text-blue-600 transition-colors">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2" aria-label="뉴스 제목">
              {shouldHighlightTitle ? <HighlightedText text={news.title} query={query} /> : news.title}
            </h3>
          </Link>
        </div>
      </div>

      <Link href={`/news/${news.id}`} className="block">
        <p
          className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4 whitespace-pre-wrap break-words leading-relaxed hover:text-gray-900"
          aria-label="뉴스 내용"
        >
          {shouldHighlightContent ? <HighlightedText text={contentText} query={query} /> : contentText}
        </p>
      </Link>
    </article>
  );
}







