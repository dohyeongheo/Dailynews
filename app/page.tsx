import { getNewsByCategoryAction } from '@/lib/actions';
import Header from '@/components/Header';
import NewsSection from '@/components/NewsSection';
import type { NewsCategory } from '@/types/news';

export default async function Home() {
  // 각 카테고리별로 뉴스 조회
  const [thailandNews, relatedNews, koreaNews] = await Promise.all([
    getNewsByCategoryAction('태국뉴스', 9),
    getNewsByCategoryAction('관련뉴스', 9),
    getNewsByCategoryAction('한국뉴스', 9),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Daily News</h1>
        </div>

        <NewsSection
          title="태국 뉴스"
          category="태국뉴스"
          news={thailandNews.success ? thailandNews.data || [] : []}
          hideOriginalLink={true}
        />

        <NewsSection
          title="한국 뉴스 (태국 관련)"
          category="관련뉴스"
          news={relatedNews.success ? relatedNews.data || [] : []}
          hideOriginalLink={true}
        />

        <NewsSection
          title="한국 뉴스"
          category="한국뉴스"
          news={koreaNews.success ? koreaNews.data || [] : []}
          hideOriginalLink={true}
        />
      </main>
    </div>
  );
}

