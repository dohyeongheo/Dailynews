import { memo } from "react";
import type { News } from "@/types/news";

interface NewsCardProps {
  news: News;
  showOriginalLink?: boolean;
}

function NewsCard({ news, showOriginalLink = true }: NewsCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    
    return `${year}년 ${month}월 ${day}일 ${hours}시 ${minutes}분`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6">
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
            <span className="px-2 py-0.5 sm:py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded whitespace-nowrap">{news.category}</span>
            <span className="px-2 py-0.5 sm:py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded whitespace-nowrap">{news.source_country}</span>
            <span className="text-xs text-gray-500 truncate">{news.source_media}</span>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{news.title}</h3>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-3 sm:mb-4 whitespace-pre-wrap break-words">{news.content_translated || news.content}</p>

      <div className="flex items-center justify-between text-xs text-gray-500 gap-2">
        <span className="truncate">{formatDate(news.created_at)}</span>
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
      </div>
    </div>
  );
}

// React.memo로 불필요한 리렌더링 방지
export default memo(NewsCard);
