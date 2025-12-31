/**
 * 비용 알림 시스템
 * 하드 코딩된 비용 임계값 및 예산 설정
 */

// 하드 코딩된 비용 설정값
export const COST_ALERT_THRESHOLD = 30000; // 비용 알림 임계값: 30,000원 (3만원)
export const MONTHLY_BUDGET = 40000; // 월별 예산: 40,000원 (4만원)

/**
 * 알림 타입
 */
export type AlertType = "budget_exceeded" | "cost_spike" | "usage_spike";

/**
 * 알림 레벨
 */
export type AlertLevel = "warning" | "critical";

/**
 * 알림 메시지 생성
 */
export function createAlertMessage(
  alertType: AlertType,
  costAmount: number,
  thresholdAmount: number,
  periodType: "daily" | "weekly" | "monthly"
): string {
  const periodLabel = periodType === "daily" ? "일별" : periodType === "weekly" ? "주별" : "월별";
  const formattedCost = new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(costAmount);
  const formattedThreshold = new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(thresholdAmount);

  switch (alertType) {
    case "budget_exceeded":
      return `${periodLabel} 예산(${formattedThreshold})을 초과했습니다. 현재 비용: ${formattedCost}`;
    case "cost_spike":
      return `${periodLabel} 비용이 임계값(${formattedThreshold})을 초과했습니다. 현재 비용: ${formattedCost}`;
    case "usage_spike":
      return `${periodLabel} 사용량이 급증했습니다. 현재 비용: ${formattedCost}`;
    default:
      return `비용 알림: ${formattedCost}`;
  }
}

/**
 * 알림 레벨 결정
 */
export function determineAlertLevel(costAmount: number, thresholdAmount: number): AlertLevel {
  // 임계값의 150%를 초과하면 critical
  if (costAmount >= thresholdAmount * 1.5) {
    return "critical";
  }
  return "warning";
}

/**
 * 알림 저장 인터페이스
 */
export interface CostAlert {
  alertType: AlertType;
  alertLevel: AlertLevel;
  message: string;
  costAmount: number;
  thresholdAmount: number;
  periodType: "daily" | "weekly" | "monthly";
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
  metadata?: Record<string, unknown>;
}

/**
 * 알림을 데이터베이스에 저장
 */
import { supabaseServer } from "@/lib/supabase/server";
import { log } from "./logger";

export async function saveCostAlert(alert: CostAlert): Promise<boolean> {
  try {
    const { error } = await supabaseServer.from("cost_alerts").insert({
      alert_type: alert.alertType,
      alert_level: alert.alertLevel,
      message: alert.message,
      cost_amount: alert.costAmount,
      threshold_amount: alert.thresholdAmount,
      period_type: alert.periodType,
      period_start: alert.periodStart,
      period_end: alert.periodEnd,
      metadata: alert.metadata || null,
    });

    if (error) {
      log.error("비용 알림 저장 실패", new Error(error.message), { alert });
      return false;
    }

    log.warn("비용 알림 저장 성공", { alert });
    return true;
  } catch (error) {
    log.error("비용 알림 저장 예외 발생", error instanceof Error ? error : new Error(String(error)), { alert });
    return false;
  }
}

/**
 * 일별 비용 급증 확인 및 알림
 */
import { getDailyCostStats } from "./cost-analyzer";

export async function checkDailyCostSpike(date: string): Promise<boolean> {
  try {
    const dailyStats = await getDailyCostStats(date, date);
    if (dailyStats.length === 0) {
      return false;
    }

    const todayStats = dailyStats[0];
    if (todayStats.totalCost > COST_ALERT_THRESHOLD) {
      const alert: CostAlert = {
        alertType: "cost_spike",
        alertLevel: determineAlertLevel(todayStats.totalCost, COST_ALERT_THRESHOLD),
        message: createAlertMessage("cost_spike", todayStats.totalCost, COST_ALERT_THRESHOLD, "daily"),
        costAmount: todayStats.totalCost,
        thresholdAmount: COST_ALERT_THRESHOLD,
        periodType: "daily",
        periodStart: date,
        periodEnd: date,
        metadata: {
          totalCalls: todayStats.totalCalls,
          totalTokens: todayStats.totalTokens,
        },
      };

      await saveCostAlert(alert);
      return true;
    }

    return false;
  } catch (error) {
    log.error("일별 비용 급증 확인 실패", error instanceof Error ? error : new Error(String(error)), { date });
    return false;
  }
}

/**
 * 월별 예산 초과 확인 및 알림
 */
import { getMonthlyCost } from "./cost-analyzer";

export async function checkMonthlyBudgetExceeded(year: number, month: number): Promise<boolean> {
  try {
    const monthlyCost = await getMonthlyCost(year, month);
    if (monthlyCost > MONTHLY_BUDGET) {
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const endDate = new Date(year, month, 0).toISOString().split("T")[0];

      const alert: CostAlert = {
        alertType: "budget_exceeded",
        alertLevel: determineAlertLevel(monthlyCost, MONTHLY_BUDGET),
        message: createAlertMessage("budget_exceeded", monthlyCost, MONTHLY_BUDGET, "monthly"),
        costAmount: monthlyCost,
        thresholdAmount: MONTHLY_BUDGET,
        periodType: "monthly",
        periodStart: startDate,
        periodEnd: endDate,
        metadata: {
          year,
          month,
          overBudget: monthlyCost - MONTHLY_BUDGET,
        },
      };

      await saveCostAlert(alert);
      return true;
    }

    return false;
  } catch (error) {
    log.error("월별 예산 초과 확인 실패", error instanceof Error ? error : new Error(String(error)), { year, month });
    return false;
  }
}

/**
 * 최근 알림 조회
 */
export async function getRecentAlerts(limit: number = 10): Promise<CostAlert[]> {
  try {
    const { data, error } = await supabaseServer
      .from("cost_alerts")
      .select("*")
      .order("sent_at", { ascending: false })
      .limit(limit);

    if (error) {
      log.error("최근 알림 조회 실패", new Error(error.message));
      return [];
    }

    return (
      data?.map((row) => ({
        alertType: row.alert_type as AlertType,
        alertLevel: row.alert_level as AlertLevel,
        message: row.message,
        costAmount: Number(row.cost_amount),
        thresholdAmount: Number(row.threshold_amount),
        periodType: row.period_type as "daily" | "weekly" | "monthly",
        periodStart: row.period_start,
        periodEnd: row.period_end,
        metadata: row.metadata as Record<string, unknown> | undefined,
      })) || []
    );
  } catch (error) {
    log.error("최근 알림 조회 예외 발생", error instanceof Error ? error : new Error(String(error)));
    return [];
  }
}

