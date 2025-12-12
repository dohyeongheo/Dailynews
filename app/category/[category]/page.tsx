import { getNewsByCategoryAction } from '@/lib/actions';
import Header from '@/components/Header';
import NewsCard from '@/components/NewsCard';
import type { NewsCategory } from '@/types/news';
import { notFound } from 'next/navigation';

interface CategoryPageProps {
  params: {
    category: string;
  };
}

// 카테고리 이름 매핑
const categoryMap: Record<string, { category: NewsCategory; title: string }> = {
  '태국뉴스': { category: '태국뉴스', title: '태국 뉴스' },
  '관련뉴스': { category: '관련뉴스', title: '한국 뉴스 (태국 관련)' },
  '한국뉴스': { category: '한국뉴스', title: '한국 뉴스' },
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  // URL 디코딩 (한글 카테고리명 처리)
  const decodedCategory = decodeURIComponent(params.category);

  // 카테고리 매핑 확인
  const categoryInfo = categoryMap[decodedCategory];

  if (!categoryInfo) {
    notFound();
  }

  // 카테고리별 모든 뉴스 조회 (제한 없이 또는 큰 수)
  const result = await getNewsByCategoryAction(categoryInfo.category, 100);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{categoryInfo.title}</h1>
          <p className="text-gray-600">
            {result.success && result.data
              ? `총 ${result.data.length}개의 뉴스`
              : '뉴스를 불러오는 중...'}
          </p>
        </div>

        {result.success && result.data && result.data.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {result.data.map((news) => (
              <NewsCard key={news.id} news={news} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-500">
              아직 {categoryInfo.title}가 없습니다. 뉴스 수집 버튼을 클릭하여 뉴스를 가져오세요.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

