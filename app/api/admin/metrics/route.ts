import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { withAdmin, withErrorHandling } from "@/lib/utils/api-middleware";
import { createSuccessResponse } from "@/lib/utils/api-response";
import { getNewsCount } from "@/lib/db/news";
import { getNewsWithFailedTranslation } from "@/lib/db/news";
import { createApiTimer } from "@/lib/utils/performance-metrics";
import { saveSystemStatsSnapshot } from "@/lib/utils/metrics-storage";

/**
 * 시스템 통계 조회 API (관리자 전용)
 */
export const GET = withAdmin(
  withErrorHandling(async (request: NextRequest) => {
    const timer = createApiTimer("/api/admin/metrics");

    // 전체 뉴스 개수
    const totalNews = await getNewsCount();

    // 카테고리별 뉴스 개수
    const newsByCategory = {
      태국뉴스: await getNewsCount("태국뉴스"),
      한국뉴스: await getNewsCount("한국뉴스"),
      관련뉴스: await getNewsCount("관련뉴스"),
    };

    // 번역 실패한 뉴스 개수는 더 이상 확인할 수 없음
    // content_translated 필드가 제거되어 번역 상태를 별도로 추적할 수 없음
    // 번역된 내용은 content 필드에 직접 저장되므로, 번역 실패 여부는 애플리케이션 로직에서만 확인 가능
    const failedTranslationCountResult = 0;

    // 이미지 없는 뉴스 개수 (실제 데이터 조회로 count 확인)
    const { data: newsWithoutImageData, count: newsWithoutImageCount, error: newsWithoutImageError } = await supabaseServer
      .from("news")
      .select("id", { count: "exact", head: false })
      .is("image_url", null);
    const newsWithoutImage = newsWithoutImageError
      ? 0
      : (newsWithoutImageCount !== null ? newsWithoutImageCount : (newsWithoutImageData?.length || 0));

    // 최근 7일간 뉴스 수집 통계 (UTC 기준)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
    sevenDaysAgo.setUTCHours(0, 0, 0, 0);
    const { data: recentNewsData, count: recentNewsCount, error: recentNewsError } = await supabaseServer
      .from("news")
      .select("id", { count: "exact", head: false })
      .gte("created_at", sevenDaysAgo.toISOString());
    const recentNews = recentNewsError
      ? 0
      : (recentNewsCount !== null ? recentNewsCount : (recentNewsData?.length || 0));

    // 오늘 수집된 뉴스 개수 (UTC 기준, 오늘 00:00:00 UTC부터)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const { data: todayNewsData, count: todayNewsCount, error: todayNewsError } = await supabaseServer
      .from("news")
      .select("id", { count: "exact", head: false })
      .gte("created_at", today.toISOString());
    const todayNews = todayNewsError
      ? 0
      : (todayNewsCount !== null ? todayNewsCount : (todayNewsData?.length || 0));

    const stats = {
      totalNews,
      newsByCategory,
      failedTranslationCount: failedTranslationCountResult,
      newsWithoutImage,
      recentNews,
      todayNews,
    };

    // 성능 메트릭 저장 (비동기로 실행하여 응답 시간에 영향 없음)
    timer.saveAsMetric("api_response_time", { endpoint: "/api/admin/metrics" }).catch((error) => {
      // 메트릭 저장 실패는 무시 (로깅만 수행)
      console.error("메트릭 저장 실패 (비동기)", error);
    });

    // 시스템 통계 스냅샷 저장 (비동기로 실행)
    saveSystemStatsSnapshot(stats).catch((error) => {
      console.error("시스템 통계 스냅샷 저장 실패 (비동기)", error);
    });

    return createSuccessResponse(stats);
  })
);

