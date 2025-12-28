import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withAdmin, withErrorHandling } from "@/lib/utils/api-middleware";
import { createSuccessResponse } from "@/lib/utils/api-response";
import { getNewsCount } from "@/lib/db/news";
import { getNewsWithFailedTranslation } from "@/lib/db/news";

/**
 * 시스템 통계 조회 API (관리자 전용)
 */
export const GET = withAdmin(
  withErrorHandling(async (request: NextRequest) => {
    const supabase = createClient();

    // 전체 뉴스 개수
    const totalNews = await getNewsCount();

    // 카테고리별 뉴스 개수
    const newsByCategory = {
      태국뉴스: await getNewsCount("태국뉴스"),
      한국뉴스: await getNewsCount("한국뉴스"),
      관련뉴스: await getNewsCount("관련뉴스"),
    };

    // 번역 실패한 뉴스 개수
    const failedTranslationNews = await getNewsWithFailedTranslation(1000);
    const failedTranslationCount = failedTranslationNews.length;

    // 이미지 없는 뉴스 개수
    const { count: newsWithoutImage } = await supabase
      .from("news")
      .select("*", { count: "exact", head: true })
      .is("image_url", null);

    // 최근 7일간 뉴스 수집 통계
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { count: recentNews } = await supabase
      .from("news")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo.toISOString());

    // 오늘 수집된 뉴스 개수
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: todayNews } = await supabase
      .from("news")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString());

    return createSuccessResponse({
      totalNews,
      newsByCategory,
      failedTranslationCount,
      newsWithoutImage: newsWithoutImage || 0,
      recentNews: recentNews || 0,
      todayNews: todayNews || 0,
    });
  })
);

