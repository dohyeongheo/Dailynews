/**
 * 메트릭 히스토리 저장 유틸리티
 * 성능 메트릭 및 비즈니스 메트릭의 스냅샷을 데이터베이스에 저장
 */

import { supabaseServer } from "@/lib/supabase/server";
import { log } from "@/lib/utils/logger";

export type MetricType = "performance" | "business" | "system";
export type MetricName =
  | "api_response_time"
  | "news_collection_success_rate"
  | "image_generation_success_rate"
  | "news_collection_count"
  | "image_generation_count"
  | "total_news"
  | "news_by_category"
  | "failed_translation_count"
  | "news_without_image";

export interface MetricSnapshot {
  metricType: MetricType;
  metricName: MetricName;
  metricValue: number;
  metadata?: Record<string, unknown>;
}

/**
 * 단일 메트릭 스냅샷 저장
 */
export async function saveMetricSnapshot(snapshot: MetricSnapshot): Promise<boolean> {
  try {
    const { error } = await supabaseServer.from("metrics_history").insert({
      metric_type: snapshot.metricType,
      metric_name: snapshot.metricName,
      metric_value: snapshot.metricValue,
      metadata: snapshot.metadata || null,
    });

    if (error) {
      log.error("메트릭 스냅샷 저장 실패", new Error(error.message), {
        snapshot,
        errorDetails: error,
      });
      return false;
    }

    log.debug("메트릭 스냅샷 저장 성공", { snapshot });
    return true;
  } catch (error) {
    log.error("메트릭 스냅샷 저장 예외 발생", error instanceof Error ? error : new Error(String(error)), { snapshot });
    return false;
  }
}

/**
 * 여러 메트릭 스냅샷 일괄 저장
 */
export async function saveMetricSnapshots(snapshots: MetricSnapshot[]): Promise<{ success: number; failed: number }> {
  if (snapshots.length === 0) {
    return { success: 0, failed: 0 };
  }

  try {
    const records = snapshots.map((snapshot) => ({
      metric_type: snapshot.metricType,
      metric_name: snapshot.metricName,
      metric_value: snapshot.metricValue,
      metadata: snapshot.metadata || null,
    }));

    const { error } = await supabaseServer.from("metrics_history").insert(records);

    if (error) {
      log.error("메트릭 스냅샷 일괄 저장 실패", new Error(error.message), {
        count: snapshots.length,
        errorDetails: error,
      });
      return { success: 0, failed: snapshots.length };
    }

    log.debug("메트릭 스냅샷 일괄 저장 성공", { count: snapshots.length });
    return { success: snapshots.length, failed: 0 };
  } catch (error) {
    log.error("메트릭 스냅샷 일괄 저장 예외 발생", error instanceof Error ? error : new Error(String(error)), {
      count: snapshots.length,
    });
    return { success: 0, failed: snapshots.length };
  }
}

/**
 * 시스템 통계 스냅샷 저장
 */
export async function saveSystemStatsSnapshot(stats: {
  totalNews: number;
  newsByCategory: { 태국뉴스: number; 한국뉴스: number; 관련뉴스: number };
  failedTranslationCount: number;
  newsWithoutImage: number;
  recentNews: number;
  todayNews: number;
}): Promise<boolean> {
  const snapshots: MetricSnapshot[] = [
    {
      metricType: "system",
      metricName: "total_news",
      metricValue: stats.totalNews,
    },
    {
      metricType: "system",
      metricName: "news_by_category",
      metricValue: stats.newsByCategory.태국뉴스 + stats.newsByCategory.한국뉴스 + stats.newsByCategory.관련뉴스,
      metadata: stats.newsByCategory,
    },
    {
      metricType: "system",
      metricName: "failed_translation_count",
      metricValue: stats.failedTranslationCount,
    },
    {
      metricType: "system",
      metricName: "news_without_image",
      metricValue: stats.newsWithoutImage,
    },
  ];

  const result = await saveMetricSnapshots(snapshots);
  return result.failed === 0;
}


