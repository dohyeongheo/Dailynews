import { getNewsByCategoryAction } from "@/lib/actions";
import dynamic from "next/dynamic";
import type { NewsCategory } from "@/types/news";

// 동적 임포트로 성능 최적화
const NewsSection = dynamic(() => import("@/components/NewsSection"), { ssr: true });

// 페이지 캐싱 설정: 60초마다 재검증
export const revalidate = 60;

export default async function Home() {
  // 각 카테고리별로 뉴스 조회
  const [thailandNews, relatedNews, koreaNews] = await Promise.all([
    getNewsByCategoryAction("태국뉴스", 9),
    getNewsByCategoryAction("관련뉴스", 9),
    getNewsByCategoryAction("한국뉴스", 9),
  ]);

  // 에러 확인 및 로깅
  if (!thailandNews.success && thailandNews.error) {
    console.error("[Home] 태국뉴스 조회 실패:", thailandNews.error);
  }
  if (!relatedNews.success && relatedNews.error) {
    console.error("[Home] 관련뉴스 조회 실패:", relatedNews.error);
  }
  if (!koreaNews.success && koreaNews.error) {
    console.error("[Home] 한국뉴스 조회 실패:", koreaNews.error);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Daily News</h1>
        </div>

        {/* 에러 메시지 표시 */}
        {(thailandNews.error || relatedNews.error || koreaNews.error) && (
          <div className="mb-4 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs sm:text-sm text-yellow-800">⚠️ 일부 뉴스를 불러오는 중 오류가 발생했습니다. 콘솔을 확인해주세요.</p>
            {process.env.NODE_ENV === "development" && (
              <div className="mt-2 text-xs text-yellow-700">
                <p>태국뉴스: {thailandNews.error || "정상"}</p>
                <p>관련뉴스: {relatedNews.error || "정상"}</p>
                <p>한국뉴스: {koreaNews.error || "정상"}</p>
              </div>
            )}
          </div>
        )}

        <NewsSection title="태국 뉴스" category="태국뉴스" news={thailandNews.success ? thailandNews.data || [] : []} hideOriginalLink={true} />

        <NewsSection title="한국 뉴스 (태국 관련)" category="관련뉴스" news={relatedNews.success ? relatedNews.data || [] : []} hideOriginalLink={true} />

        <NewsSection title="한국 뉴스" category="한국뉴스" news={koreaNews.success ? koreaNews.data || [] : []} hideOriginalLink={true} />
      </main>
    </div>
  );
}
