import type { News, NewsCategory } from '@/types/news';
import NewsCard from './NewsCard';
import Link from 'next/link';

interface NewsSectionProps {
  title: string;
  category: NewsCategory;
  news: News[];
  hideOriginalLink?: boolean;
}

export default function NewsSection({ title, category, news, hideOriginalLink = false }: NewsSectionProps) {
  // 카테고리 URL 매핑
  const categoryUrl = `/category/${encodeURIComponent(category)}`;

  if (news.length === 0) {
    return (
      <section className="mb-8 sm:mb-12">
        <div className="mb-4 sm:mb-6">
          <Link href={categoryUrl} className="text-xl sm:text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
            {title}
          </Link>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-8 text-center">
          <p className="text-sm sm:text-base text-gray-500">아직 {title}가 없습니다. 뉴스 수집 버튼을 클릭하여 뉴스를 가져오세요.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8 sm:mb-12">
      <div className="mb-4 sm:mb-6 flex items-center justify-between">
        <Link href={categoryUrl} className="text-xl sm:text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
          {title}
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {news.map((item) => (
          <NewsCard key={item.id} news={item} />
        ))}
      </div>
      <div className="mt-4 sm:mt-6 flex justify-end">
        <Link
          href={categoryUrl}
          className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
        >
          더보기
        </Link>
      </div>
    </section>
  );
}

