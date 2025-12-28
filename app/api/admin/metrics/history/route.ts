import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { withAdmin, withErrorHandling } from "@/lib/utils/api-middleware";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api-response";
import type { MetricType, MetricName } from "@/lib/utils/metrics-storage";

interface MetricsHistoryQuery {
  metricType?: MetricType;
  metricName?: MetricName;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  limit?: number; // 기본값: 100
}

/**
 * 메트릭 히스토리 조회 API (관리자 전용)
 * GET /api/admin/metrics/history?metricType=performance&metricName=api_response_time&startDate=2024-01-01&endDate=2024-01-31&limit=100
 */
export const GET = withAdmin(
  withErrorHandling(async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);

    const query: MetricsHistoryQuery = {
      metricType: searchParams.get("metricType") as MetricType | undefined,
      metricName: searchParams.get("metricName") as MetricName | undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      limit: parseInt(searchParams.get("limit") || "100", 10),
    };

    // 기본값: 최근 7일
    if (!query.startDate && !query.endDate) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      query.startDate = startDate.toISOString();
      query.endDate = endDate.toISOString();
    }

    let dbQuery = supabaseServer.from("metrics_history").select("*").order("created_at", { ascending: false });

    if (query.metricType) {
      dbQuery = dbQuery.eq("metric_type", query.metricType);
    }

    if (query.metricName) {
      dbQuery = dbQuery.eq("metric_name", query.metricName);
    }

    if (query.startDate) {
      dbQuery = dbQuery.gte("created_at", query.startDate);
    }

    if (query.endDate) {
      dbQuery = dbQuery.lte("created_at", query.endDate);
    }

    if (query.limit) {
      dbQuery = dbQuery.limit(query.limit);
    }

    const { data, error } = await dbQuery;

    if (error) {
      const errorObj = new Error("메트릭 히스토리 조회 실패");
      (errorObj as { details?: unknown }).details = error;
      return createErrorResponse(errorObj, 500);
    }

    return createSuccessResponse({
      metrics: data || [],
      count: data?.length || 0,
      query,
    });
  })
);

