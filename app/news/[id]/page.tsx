import { getNewsById, getRelatedNews } from "@/lib/db/news";
import { getCommentsByNewsId } from "@/lib/db/comments";
import { incrementViewCount, getViewCount } from "@/lib/db/views";
import { auth } from "@/auth";
import CommentSection from "@/components/CommentSection";
import RelatedNews from "@/components/RelatedNews";
import NewsReactions from "@/components/NewsReactions";
import { notFound } from "next/navigation";
import { Metadata } from "next";

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

          <NewsReactions newsId={params.id} />

          <CommentSection newsId={params.id} initialComments={comments} session={session} />
        </article>

        {/* 관련 뉴스 섹션 */}
        <RelatedNews news={relatedNews} currentNewsId={params.id} />
      </div>
    </div>
  );
}
