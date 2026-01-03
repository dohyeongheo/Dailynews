"use client";

import React from "react";
import Link from "next/link";
import CategoryBadge from "@/components/CategoryBadge";
import type { News } from "@/types/news";
import { formatNewsDate } from "@/lib/utils/date-format";

interface NewsCardProps {
  news: News;
}

const NewsCard = React.memo(function NewsCard({ news }: NewsCardProps) {

  return (
    <article className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <Link href={`/news/${news.id}`} className="block p-4 sm:p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {/* 기본 카테고리 (category) */}
              <CategoryBadge category={news.category} type="main" className="text-xs px-2.5 py-1" />

              {/* 상세 카테고리 (news_category) */}
              {news.news_category && <CategoryBadge category={news.news_category} type="topic" className="text-xs px-2.5 py-1" />}
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">{news.title}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
              <span className="font-medium text-blue-600">{news.source_media}</span>
              <span>•</span>
              <span>{formatNewsDate(news.published_date)}</span>
            </div>
          </div>
        </div>

        <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap break-words leading-relaxed">{news.content}</p>
      </Link>
    </article>
  );
});

export default NewsCard;
