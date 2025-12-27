import { getNewsById, getRelatedNews } from "@/lib/db/news";
import { incrementViewCount, getViewCount } from "@/lib/db/views";
import RelatedNews from "@/components/RelatedNews";
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

  // 병렬로 데이터 로드 및 조회수 증가
  const [relatedNews, _] = await Promise.all([
    getRelatedNews(params.id, news.category, 5),
    incrementViewCount(params.id),
  ]);

  // 최신 조회수 가져오기
  const viewCount = await getViewCount(params.id);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <article className="bg-white rounded-xl shadow-lg overflow-hidden p-6 sm:p-10">
          <header className="mb-8">
            {news.news_category && (
              <div className="mb-3">
                <span className={`px-3 py-1.5 rounded-md text-sm font-semibold border inline-block ${
                  news.news_category === '정치' ? 'bg-red-100 text-red-700 border-red-200' :
                  news.news_category === '경제' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                  news.news_category === '사회' ? 'bg-green-100 text-green-700 border-green-200' :
                  news.news_category === '과학' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                  news.news_category === '스포츠' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                  news.news_category === '문화' ? 'bg-pink-100 text-pink-700 border-pink-200' :
                  news.news_category === '기술' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                  news.news_category === '건강' ? 'bg-teal-100 text-teal-700 border-teal-200' :
                  news.news_category === '환경' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                  news.news_category === '국제' ? 'bg-cyan-100 text-cyan-700 border-cyan-200' :
                  'bg-gray-100 text-gray-700 border-gray-200'
                }`}>
                  {news.news_category}
                </span>
              </div>
            )}
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">{news.title}</h1>

            <div className="flex flex-wrap items-center gap-4 text-gray-500 text-sm border-b pb-6">
              <span className="font-semibold text-gray-700">{news.source_media}</span>
              <span>•</span>
              <time>{new Date(news.published_date).toLocaleDateString("ko-KR")}</time>
              <span>•</span>
              <span>조회수 {viewCount}</span>
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

          <div className="prose max-w-none mb-10 text-gray-800 leading-relaxed whitespace-pre-wrap">{news.content_translated || news.content}</div>
        </article>

        {/* 관련 뉴스 섹션 */}
        <RelatedNews news={relatedNews} currentNewsId={params.id} />
      </div>
    </div>
  );
}
