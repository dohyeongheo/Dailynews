/**
 * Gemini API 비용 조회 스크립트
 * 수동으로 비용 정보를 조회하고 출력
 */

import { getDailyCostStats, getModelCostStats, getTaskTypeCostStats, getMonthlyCost } from "@/lib/utils/cost-analyzer";
import { getRecentAlerts, MONTHLY_BUDGET, COST_ALERT_THRESHOLD } from "@/lib/utils/cost-alert";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(amount);
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat("ko-KR").format(num);
}

async function main() {
  console.log("=".repeat(60));
  console.log("Gemini API 비용 조회");
  console.log("=".repeat(60));
  console.log();

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  // 월별 비용
  console.log("📊 월별 비용");
  console.log("-".repeat(60));
  const monthlyCost = await getMonthlyCost(currentYear, currentMonth);
  console.log(`이번 달 비용: ${formatCurrency(monthlyCost)}`);
  console.log(`월별 예산: ${formatCurrency(MONTHLY_BUDGET)}`);
  console.log(`예산 사용률: ${((monthlyCost / MONTHLY_BUDGET) * 100).toFixed(1)}%`);
  if (monthlyCost > MONTHLY_BUDGET) {
    console.log(`⚠️  예산 초과: ${formatCurrency(monthlyCost - MONTHLY_BUDGET)}`);
  }
  console.log();

  // 최근 7일 통계
  const weekAgo = new Date(today);
  weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);
  const startDate = weekAgo.toISOString().split("T")[0];
  const endDate = today.toISOString().split("T")[0];

  console.log("📈 최근 7일 통계");
  console.log("-".repeat(60));
  const dailyStats = await getDailyCostStats(startDate, endDate);
  const totalCost = dailyStats.reduce((sum, stat) => sum + stat.totalCost, 0);
  const totalTokens = dailyStats.reduce((sum, stat) => sum + stat.totalTokens, 0);
  const totalCalls = dailyStats.reduce((sum, stat) => sum + stat.totalCalls, 0);
  console.log(`기간: ${startDate} ~ ${endDate}`);
  console.log(`총 비용: ${formatCurrency(totalCost)}`);
  console.log(`총 토큰: ${formatNumber(totalTokens)}`);
  console.log(`총 호출: ${formatNumber(totalCalls)}`);
  console.log();

  // 모델별 통계
  console.log("🤖 모델별 통계");
  console.log("-".repeat(60));
  const modelStats = await getModelCostStats(startDate, endDate);
  modelStats.forEach((stat) => {
    console.log(`${stat.modelName}:`);
    console.log(`  총 비용: ${formatCurrency(stat.totalCost)}`);
    console.log(`  총 토큰: ${formatNumber(stat.totalTokens)}`);
    console.log(`  호출 횟수: ${formatNumber(stat.totalCalls)}`);
    console.log(`  호출당 평균 비용: ${formatCurrency(stat.averageCostPerCall)}`);
    console.log();
  });

  // 작업 유형별 통계
  console.log("📝 작업 유형별 통계");
  console.log("-".repeat(60));
  const taskStats = await getTaskTypeCostStats(startDate, endDate);
  taskStats.forEach((stat) => {
    const taskName =
      stat.taskType === "news_collection"
        ? "뉴스 수집"
        : stat.taskType === "translation"
        ? "번역"
        : stat.taskType === "prompt_generation"
        ? "프롬프트 생성"
        : stat.taskType;
    console.log(`${taskName}:`);
    console.log(`  총 비용: ${formatCurrency(stat.totalCost)}`);
    console.log(`  총 토큰: ${formatNumber(stat.totalTokens)}`);
    console.log(`  호출 횟수: ${formatNumber(stat.totalCalls)}`);
    console.log(`  호출당 평균 비용: ${formatCurrency(stat.averageCostPerCall)}`);
    console.log();
  });

  // 최근 알림
  console.log("🔔 최근 알림");
  console.log("-".repeat(60));
  const recentAlerts = await getRecentAlerts(5);
  if (recentAlerts.length === 0) {
    console.log("알림 없음");
  } else {
    recentAlerts.forEach((alert, index) => {
      console.log(`${index + 1}. [${alert.alertLevel}] ${alert.message}`);
      console.log(`   기간: ${alert.periodStart} ~ ${alert.periodEnd}`);
      console.log();
    });
  }

  console.log("=".repeat(60));
}

main().catch((error) => {
  console.error("스크립트 실행 실패:", error);
  process.exit(1);
});

