import type { News } from '@/types/news';

interface NewsCardProps {
  news: News;
  showOriginalLink?: boolean;
}

export default function NewsCard({ news, showOriginalLink = true }: NewsCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
              {news.category}
            </span>
            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
              {news.source_country}
            </span>
            <span className="text-xs text-gray-500">{news.source_media}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {news.title}
          </h3>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        {news.content_translated || news.content}
      </p>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{formatDate(news.published_date)}</span>
        {showOriginalLink && news.original_link && news.original_link !== '#' ? (
          <a
            href={news.original_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            원문 보기 →
          </a>
        ) : null}
      </div>
    </div>
  );
}

