import { getNewsById, getRelatedNews } from "@/lib/db/news";
import RelatedNews from "@/components/RelatedNews";
import CategoryBadge from "@/components/CategoryBadge";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Image from "next/image";

// 페이지 캐싱 설정: 300초마다 재검증 (5분)
export const revalidate = 300;

// 메타데이터 생성
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const news = await getNewsById(params.id);

  if (!news) {
    return { title: "뉴스 없음" };
  }

  return {
    title: news.title,
    description: news.content.substring(0, 160),
    openGraph: {
      title: news.title,
      description: news.content.substring(0, 160),
      type: "article",
      publishedTime: news.published_date,
    },
  };
}

export default async function NewsDetailPage({ params }: { params: { id: string } }) {
  // 뉴스 조회 (없으면 404)
  const news = await getNewsById(params.id);
  if (!news) {
    notFound();
  }

  // 관련 뉴스 로드
  const relatedNews = await getRelatedNews(params.id, news.category, 5);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <article className="bg-white rounded-xl shadow-lg overflow-hidden p-6 sm:p-10">
          <header className="mb-8">
            <div className="mb-3 flex items-center gap-2 flex-wrap">
              {/* 기본 카테고리 */}
              <CategoryBadge category={news.category} type="main" />

              {/* 상세 카테고리 */}
              {news.news_category && (
                <CategoryBadge category={news.news_category} type="topic" />
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">{news.title}</h1>

            <div className="flex flex-wrap items-center gap-4 text-gray-500 text-sm border-b pb-6">
              <span className="font-semibold text-gray-700">{news.source_media}</span>
              <span>•</span>
              <time>{new Date(news.published_date).toLocaleDateString("ko-KR")}</time>
            </div>
          </header>

          {/* AI 생성 이미지 표시 (image_url이 있을 때만) */}
          {news.image_url && (
            <div className="mb-8">
              <div className="relative w-full h-auto rounded-lg overflow-hidden shadow-md">
                <Image
                  src={news.image_url}
                  alt={news.title}
                  width={1024}
                  height={1024}
                  className="w-full h-auto object-cover"
                  priority
                  unoptimized // Vercel Blob은 이미 최적화되어 있으므로
                />
              </div>
            </div>
          )}

          <div className="prose max-w-none mb-10 text-gray-800 leading-relaxed whitespace-pre-wrap">{news.content}</div>
        </article>

        {/* 관련 뉴스 섹션 */}
        <RelatedNews news={relatedNews} currentNewsId={params.id} />
      </div>
    </div>
  );
}
