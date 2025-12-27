import { getNewsByTopicCategoryPaginatedAction } from "@/lib/actions";
import TopicNewsListInfinite from "@/components/TopicNewsListInfinite";
import type { NewsTopicCategory } from "@/types/news";
import { notFound } from "next/navigation";

// 페이지 캐싱 설정: 60초마다 재검증
export const revalidate = 60;

interface TopicPageProps {
  params: {
    topic: string;
  };
}

// 주제 카테고리 이름 매핑
const topicMap: Record<string, { topic: NewsTopicCategory; title: string }> = {
  정치: { topic: "정치", title: "정치 뉴스" },
  경제: { topic: "경제", title: "경제 뉴스" },
  사회: { topic: "사회", title: "사회 뉴스" },
  과학: { topic: "과학", title: "과학 뉴스" },
  스포츠: { topic: "스포츠", title: "스포츠 뉴스" },
  문화: { topic: "문화", title: "문화 뉴스" },
  기술: { topic: "기술", title: "기술 뉴스" },
  건강: { topic: "건강", title: "건강 뉴스" },
  환경: { topic: "환경", title: "환경 뉴스" },
  국제: { topic: "국제", title: "국제 뉴스" },
  기타: { topic: "기타", title: "기타 뉴스" },
};

export default async function TopicPage({ params }: TopicPageProps) {
  // URL 디코딩 (한글 카테고리명 처리)
  const decodedTopic = decodeURIComponent(params.topic);

  // 주제 카테고리 매핑 확인
  const topicInfo = topicMap[decodedTopic];

  if (!topicInfo) {
    notFound();
  }

  // 주제 카테고리별 첫 페이지 뉴스 조회
  const result = await getNewsByTopicCategoryPaginatedAction(topicInfo.topic, 1, 12);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{topicInfo.title}</h1>
        </div>

        {result.success && result.data && result.data.length > 0 ? (
          <TopicNewsListInfinite topic={topicInfo.topic} initialNews={result.data} initialHasMore={result.hasMore} />
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-8 text-center">
            <p className="text-sm sm:text-base text-gray-500">아직 {topicInfo.title}가 없습니다. 뉴스 수집 버튼을 클릭하여 뉴스를 가져오세요.</p>
          </div>
        )}
      </main>
    </div>
  );
}

