/**
 * 비용 분석 모듈
 * 일별/주별/월별 추이, 모델별 비교, 절감 제안 생성
 */

import { supabaseServer } from "@/lib/supabase/server";
import { log } from "./logger";
import { MONTHLY_BUDGET, COST_ALERT_THRESHOLD } from "./cost-alert";

/**
 * 일별 비용 통계
 */
export interface DailyCostStats {
  date: string; // YYYY-MM-DD
  totalCost: number; // 총 비용 (원)
  totalTokens: number; // 총 토큰 수
  totalCalls: number; // 총 호출 횟수
  successfulCalls: number; // 성공한 호출 횟수
  failedCalls: number; // 실패한 호출 횟수
  averageResponseTime: number; // 평균 응답 시간 (밀리초)
}

/**
 * 모델별 비용 통계
 */
export interface ModelCostStats {
  modelName: string;
  totalCost: number;
  totalTokens: number;
  totalCalls: number;
  averageCostPerCall: number;
  averageTokensPerCall: number;
}

/**
 * 작업 유형별 비용 통계
 */
export interface TaskTypeCostStats {
  taskType: string;
  totalCost: number;
  totalTokens: number;
  totalCalls: number;
  averageCostPerCall: number;
}

/**
 * 비용 절감 제안
 */
export interface CostOptimizationSuggestion {
  type: "model_switch" | "cache_optimization" | "batch_processing" | "error_reduction";
  title: string;
  description: string;
  estimatedSavings: number; // 예상 절감 비용 (원)
  priority: "high" | "medium" | "low";
}

/**
 * 일별 비용 통계 조회
 */
export async function getDailyCostStats(startDate: string, endDate: string): Promise<DailyCostStats[]> {
  try {
    const { data, error } = await supabaseServer
      .from("gemini_usage_logs")
      .select("*")
      .gte("created_at", `${startDate}T00:00:00Z`)
      .lte("created_at", `${endDate}T23:59:59Z`)
      .order("created_at", { ascending: true });

    if (error) {
      log.error("일별 비용 통계 조회 실패", new Error(error.message), { startDate, endDate });
      return [];
    }

    // 날짜별로 그룹화
    const dailyStatsMap = new Map<string, DailyCostStats & { totalResponseTime: number }>();

    data?.forEach((log) => {
      const date = new Date(log.created_at).toISOString().split("T")[0];
      const existing = dailyStatsMap.get(date);

      if (!existing) {
        dailyStatsMap.set(date, {
          date,
          totalCost: 0,
          totalTokens: 0,
          totalCalls: 0,
          successfulCalls: 0,
          failedCalls: 0,
          averageResponseTime: 0,
          totalResponseTime: 0,
        });
      }

      const stats = dailyStatsMap.get(date)!;
      stats.totalCost += Number(log.estimated_cost || 0);
      stats.totalTokens += Number(log.total_tokens || 0);
      stats.totalCalls += 1;
      if (log.success) {
        stats.successfulCalls += 1;
      } else {
        stats.failedCalls += 1;
      }
      stats.totalResponseTime += Number(log.response_time_ms || 0);
    });

    // 평균 응답 시간 계산 및 반환
    return Array.from(dailyStatsMap.values()).map((stats) => {
      const { totalResponseTime, ...rest } = stats;
      return {
        ...rest,
        averageResponseTime: stats.totalCalls > 0 ? Math.round(totalResponseTime / stats.totalCalls) : 0,
      };
    });
  } catch (error) {
    log.error("일별 비용 통계 조회 예외 발생", error instanceof Error ? error : new Error(String(error)), {
      startDate,
      endDate,
    });
    return [];
  }
}

/**
 * 모델별 비용 통계 조회
 */
export async function getModelCostStats(startDate: string, endDate: string): Promise<ModelCostStats[]> {
  try {
    const { data, error } = await supabaseServer
      .from("gemini_usage_logs")
      .select("*")
      .gte("created_at", `${startDate}T00:00:00Z`)
      .lte("created_at", `${endDate}T23:59:59Z`);

    if (error) {
      log.error("모델별 비용 통계 조회 실패", new Error(error.message), { startDate, endDate });
      return [];
    }

    // 모델별로 그룹화
    const modelStatsMap = new Map<string, ModelCostStats>();

    data?.forEach((log) => {
      const modelName = log.model_name;
      const existing = modelStatsMap.get(modelName);

      if (!existing) {
        modelStatsMap.set(modelName, {
          modelName,
          totalCost: 0,
          totalTokens: 0,
          totalCalls: 0,
          averageCostPerCall: 0,
          averageTokensPerCall: 0,
        });
      }

      const stats = modelStatsMap.get(modelName)!;
      stats.totalCost += Number(log.estimated_cost || 0);
      stats.totalTokens += Number(log.total_tokens || 0);
      stats.totalCalls += 1;
    });

    // 평균 계산
    return Array.from(modelStatsMap.values()).map((stats) => ({
      ...stats,
      averageCostPerCall: stats.totalCalls > 0 ? stats.totalCost / stats.totalCalls : 0,
      averageTokensPerCall: stats.totalCalls > 0 ? Math.round(stats.totalTokens / stats.totalCalls) : 0,
    }));
  } catch (error) {
    log.error("모델별 비용 통계 조회 예외 발생", error instanceof Error ? error : new Error(String(error)), {
      startDate,
      endDate,
    });
    return [];
  }
}

/**
 * 작업 유형별 비용 통계 조회
 */
export async function getTaskTypeCostStats(startDate: string, endDate: string): Promise<TaskTypeCostStats[]> {
  try {
    const { data, error } = await supabaseServer
      .from("gemini_usage_logs")
      .select("*")
      .gte("created_at", `${startDate}T00:00:00Z`)
      .lte("created_at", `${endDate}T23:59:59Z`);

    if (error) {
      log.error("작업 유형별 비용 통계 조회 실패", new Error(error.message), { startDate, endDate });
      return [];
    }

    // 작업 유형별로 그룹화
    const taskStatsMap = new Map<string, TaskTypeCostStats>();

    data?.forEach((log) => {
      const taskType = log.task_type;
      const existing = taskStatsMap.get(taskType);

      if (!existing) {
        taskStatsMap.set(taskType, {
          taskType,
          totalCost: 0,
          totalTokens: 0,
          totalCalls: 0,
          averageCostPerCall: 0,
        });
      }

      const stats = taskStatsMap.get(taskType)!;
      stats.totalCost += Number(log.estimated_cost || 0);
      stats.totalTokens += Number(log.total_tokens || 0);
      stats.totalCalls += 1;
    });

    // 평균 계산
    return Array.from(taskStatsMap.values()).map((stats) => ({
      ...stats,
      averageCostPerCall: stats.totalCalls > 0 ? stats.totalCost / stats.totalCalls : 0,
    }));
  } catch (error) {
    log.error("작업 유형별 비용 통계 조회 예외 발생", error instanceof Error ? error : new Error(String(error)), {
      startDate,
      endDate,
    });
    return [];
  }
}

/**
 * 월별 비용 합계 조회
 */
export async function getMonthlyCost(year: number, month: number): Promise<number> {
  try {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = new Date(year, month, 0).toISOString().split("T")[0]; // 해당 월의 마지막 날

    const { data, error } = await supabaseServer
      .from("gemini_usage_logs")
      .select("estimated_cost")
      .gte("created_at", `${startDate}T00:00:00Z`)
      .lte("created_at", `${endDate}T23:59:59Z`);

    if (error) {
      log.error("월별 비용 조회 실패", new Error(error.message), { year, month });
      return 0;
    }

    const totalCost = data?.reduce((sum, log) => sum + Number(log.estimated_cost || 0), 0) || 0;
    return totalCost;
  } catch (error) {
    log.error("월별 비용 조회 예외 발생", error instanceof Error ? error : new Error(String(error)), { year, month });
    return 0;
  }
}

/**
 * 비용 절감 제안 생성
 */
export async function generateCostOptimizationSuggestions(
  startDate: string,
  endDate: string
): Promise<CostOptimizationSuggestion[]> {
  const suggestions: CostOptimizationSuggestion[] = [];

  try {
    // 모델별 통계 조회
    const modelStats = await getModelCostStats(startDate, endDate);
    const taskStats = await getTaskTypeCostStats(startDate, endDate);
    const dailyStats = await getDailyCostStats(startDate, endDate);

    // 1. 모델 전환 제안 (Pro -> Flash)
    const proModel = modelStats.find((s) => s.modelName.includes("pro"));
    const flashModel = modelStats.find((s) => s.modelName.includes("flash"));

    if (proModel && flashModel) {
      const proCostPerToken = proModel.totalTokens > 0 ? proModel.totalCost / proModel.totalTokens : 0;
      const flashCostPerToken = flashModel.totalTokens > 0 ? flashModel.totalCost / flashModel.totalTokens : 0;

      if (proCostPerToken > flashCostPerToken * 1.2) {
        // Pro 모델이 Flash보다 20% 이상 비쌀 때
        const estimatedSavings = proModel.totalCost * 0.3; // Pro 사용량의 30% 절감 가정
        suggestions.push({
          type: "model_switch",
          title: "Pro 모델을 Flash 모델로 전환 고려",
          description: `Pro 모델 사용량이 많아 비용이 높습니다. 단순 작업은 Flash 모델로 전환하면 약 ${Math.round(estimatedSavings)}원 절감 가능합니다.`,
          estimatedSavings: Math.round(estimatedSavings),
          priority: "high",
        });
      }
    }

    // 2. 에러 감소 제안
    const totalFailedCalls = dailyStats.reduce((sum, stat) => sum + stat.failedCalls, 0);
    const totalCalls = dailyStats.reduce((sum, stat) => sum + stat.totalCalls, 0);
    const errorRate = totalCalls > 0 ? totalFailedCalls / totalCalls : 0;

    if (errorRate > 0.05) {
      // 에러율이 5% 이상일 때
      const averageCostPerCall = dailyStats.reduce((sum, stat) => sum + stat.totalCost, 0) / totalCalls;
      const estimatedSavings = totalFailedCalls * averageCostPerCall;
      suggestions.push({
        type: "error_reduction",
        title: "API 호출 에러 감소 필요",
        description: `에러율이 ${(errorRate * 100).toFixed(1)}%입니다. 에러를 줄이면 약 ${Math.round(estimatedSavings)}원 절감 가능합니다.`,
        estimatedSavings: Math.round(estimatedSavings),
        priority: "high",
      });
    }

    // 3. 캐시 최적화 제안
    const translationTask = taskStats.find((s) => s.taskType === "translation");
    if (translationTask && translationTask.totalCalls > 100) {
      // 번역 작업이 많을 때
      const estimatedSavings = translationTask.totalCost * 0.1; // 캐시로 10% 절감 가정
      suggestions.push({
        type: "cache_optimization",
        title: "Context Caching 활용 강화",
        description: `번역 작업이 많습니다. Context Caching을 더 적극 활용하면 약 ${Math.round(estimatedSavings)}원 절감 가능합니다.`,
        estimatedSavings: Math.round(estimatedSavings),
        priority: "medium",
      });
    }

    // 4. 배치 처리 제안
    const newsCollectionTask = taskStats.find((s) => s.taskType === "news_collection");
    if (newsCollectionTask && newsCollectionTask.totalCalls > 50) {
      const estimatedSavings = newsCollectionTask.totalCost * 0.05; // 배치 처리로 5% 절감 가정
      suggestions.push({
        type: "batch_processing",
        title: "배치 처리 고려",
        description: `뉴스 수집 작업을 배치로 처리하면 약 ${Math.round(estimatedSavings)}원 절감 가능합니다.`,
        estimatedSavings: Math.round(estimatedSavings),
        priority: "low",
      });
    }
  } catch (error) {
    log.error("비용 절감 제안 생성 실패", error instanceof Error ? error : new Error(String(error)), {
      startDate,
      endDate,
    });
  }

  return suggestions;
}

