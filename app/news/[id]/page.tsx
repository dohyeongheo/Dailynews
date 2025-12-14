import { getNewsById, getRelatedNews } from "@/lib/db/news";
import { getCommentsByNewsId } from "@/lib/db/comments";
import { incrementViewCount, getViewCount } from "@/lib/db/views";
import { auth } from "@/auth";
import CommentSection from "@/components/CommentSection";
import RelatedNews from "@/components/RelatedNews";
import { notFound } from "next/navigation";
import { Metadata } from "next";

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
  const [comments, session, relatedNews, _] = await Promise.all([
    getCommentsByNewsId(params.id),
    auth(),
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
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">{news.category}</span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">{news.source_country}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">{news.title}</h1>

            <div className="flex flex-wrap items-center gap-4 text-gray-500 text-sm border-b pb-6">
              <span className="font-semibold text-gray-700">{news.source_media}</span>
              <span>•</span>
              <time>{new Date(news.published_date).toLocaleDateString("ko-KR")}</time>
              <span>•</span>
              <span>조회수 {viewCount}</span>
            </div>
          </header>

          <div className="prose max-w-none mb-10 text-gray-800 leading-relaxed whitespace-pre-wrap">{news.content_translated || news.content}</div>

          <div className="bg-gray-50 p-4 rounded-lg mb-10 flex justify-between items-center">
            <span className="text-sm text-gray-600">원본 기사 확인하기</span>
            {news.original_link && news.original_link !== "#" ? (
              <a
                href={news.original_link}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
              >
                원문 페이지로 이동 →
              </a>
            ) : (
              <span className="text-sm text-gray-400">링크 없음</span>
            )}
          </div>

          <CommentSection newsId={params.id} initialComments={comments} session={session} />
        </article>

        {/* 관련 뉴스 섹션 */}
        <RelatedNews news={relatedNews} currentNewsId={params.id} />
      </div>
    </div>
  );
}
