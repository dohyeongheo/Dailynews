import { memo } from "react";
import type { News } from "@/types/news";

interface NewsCardProps {
  news: News;
  showOriginalLink?: boolean;
}

function NewsCard({ news, showOriginalLink = true }: NewsCardProps) {
  const formatDate = (dateString: string) => {
    // created_at은 UTC로 저장되어 있으므로, 태국 시간대(Asia/Bangkok, UTC+7)로 변환
    const date = new Date(dateString);

    // Intl.DateTimeFormat을 사용하여 태국 시간대로 변환
    const formatter = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const year = parts.find(p => p.type === 'year')?.value || '';
    const month = parts.find(p => p.type === 'month')?.value || '';
    const day = parts.find(p => p.type === 'day')?.value || '';
    const hours = parts.find(p => p.type === 'hour')?.value || '';
    const minutes = parts.find(p => p.type === 'minute')?.value || '';

    return `${year}년 ${month}월 ${day}일 ${hours}시 ${minutes}분`;
  };

  return (
    <article
      className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6"
      aria-label={`${news.category} 뉴스: ${news.title}`}
    >
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
            <span className="px-2 py-0.5 sm:py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded whitespace-nowrap">{news.category}</span>
            <span className="px-2 py-0.5 sm:py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded whitespace-nowrap">{news.source_country}</span>
            <span className="text-xs text-gray-500 truncate">{news.source_media}</span>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2" aria-label="뉴스 제목">{news.title}</h3>
        </div>
      </div>

      <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4 whitespace-pre-wrap break-words leading-relaxed" aria-label="뉴스 내용">{news.content_translated || news.content}</p>

      <div className="flex items-center justify-end text-xs text-gray-500 gap-2">
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
        <time dateTime={news.created_at} className="whitespace-nowrap" aria-label="뉴스 생성 시간">{formatDate(news.created_at)}</time>
      </div>
    </article>
  );
}

// React.memo로 불필요한 리렌더링 방지
export default memo(NewsCard);
