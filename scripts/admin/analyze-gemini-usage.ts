/**
 * Gemini API 사용량 분석 스크립트
 * 사용량 분석 리포트 생성 및 비용 최적화 제안
 */

import {
  getDailyCostStats,
  getModelCostStats,
  getTaskTypeCostStats,
  generateCostOptimizationSuggestions,
} from "@/lib/utils/cost-analyzer";
import { MONTHLY_BUDGET, COST_ALERT_THRESHOLD } from "@/lib/utils/cost-alert";

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
  console.log("Gemini API 사용량 분석 리포트");
  console.log("=".repeat(60));
  console.log();

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const startDate = monthStart.toISOString().split("T")[0];
  const endDate = today.toISOString().split("T")[0];

  console.log(`분석 기간: ${startDate} ~ ${endDate}`);
  console.log();

  // 일별 통계
  console.log("📊 일별 비용 추이");
  console.log("-".repeat(60));
  const dailyStats = await getDailyCostStats(startDate, endDate);
  dailyStats.forEach((stat) => {
    const costBar = "█".repeat(Math.min(Math.round((stat.totalCost / COST_ALERT_THRESHOLD) * 20), 20));
    console.log(
      `${stat.date}: ${formatCurrency(stat.totalCost).padEnd(15)} ${costBar} (${formatNumber(stat.totalCalls)} 호출)`
    );
  });
  console.log();

  // 모델별 분석
  console.log("🤖 모델별 사용량 분석");
  console.log("-".repeat(60));
  const modelStats = await getModelCostStats(startDate, endDate);
  const totalCost = modelStats.reduce((sum, stat) => sum + stat.totalCost, 0);
  modelStats.forEach((stat) => {
    const percentage = totalCost > 0 ? (stat.totalCost / totalCost) * 100 : 0;
    console.log(`${stat.modelName}:`);
    console.log(`  비용: ${formatCurrency(stat.totalCost)} (${percentage.toFixed(1)}%)`);
    console.log(`  토큰: ${formatNumber(stat.totalTokens)}`);
    console.log(`  호출: ${formatNumber(stat.totalCalls)}`);
    console.log(`  호출당 평균: ${formatCurrency(stat.averageCostPerCall)}`);
    console.log();
  });

  // 작업 유형별 분석
  console.log("📝 작업 유형별 사용량 분석");
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
    const percentage = totalCost > 0 ? (stat.totalCost / totalCost) * 100 : 0;
    console.log(`${taskName}:`);
    console.log(`  비용: ${formatCurrency(stat.totalCost)} (${percentage.toFixed(1)}%)`);
    console.log(`  토큰: ${formatNumber(stat.totalTokens)}`);
    console.log(`  호출: ${formatNumber(stat.totalCalls)}`);
    console.log(`  호출당 평균: ${formatCurrency(stat.averageCostPerCall)}`);
    console.log();
  });

  // 비용 절감 제안
  console.log("💡 비용 절감 제안");
  console.log("-".repeat(60));
  const suggestions = await generateCostOptimizationSuggestions(startDate, endDate);
  if (suggestions.length === 0) {
    console.log("현재 비용 최적화 제안이 없습니다.");
  } else {
    suggestions.forEach((suggestion, index) => {
      const priorityEmoji = suggestion.priority === "high" ? "🔴" : suggestion.priority === "medium" ? "🟡" : "🔵";
      console.log(`${index + 1}. ${priorityEmoji} ${suggestion.title}`);
      console.log(`   ${suggestion.description}`);
      console.log(`   예상 절감: ${formatCurrency(suggestion.estimatedSavings)}`);
      console.log();
    });
  }

  // 요약
  console.log("📋 요약");
  console.log("-".repeat(60));
  const totalTokens = dailyStats.reduce((sum, stat) => sum + stat.totalTokens, 0);
  const totalCalls = dailyStats.reduce((sum, stat) => sum + stat.totalCalls, 0);
  const successfulCalls = dailyStats.reduce((sum, stat) => sum + stat.successfulCalls, 0);
  const failedCalls = dailyStats.reduce((sum, stat) => sum + stat.failedCalls, 0);
  const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;
  const averageCostPerCall = totalCalls > 0 ? totalCost / totalCalls : 0;

  console.log(`총 비용: ${formatCurrency(totalCost)}`);
  console.log(`총 토큰: ${formatNumber(totalTokens)}`);
  console.log(`총 호출: ${formatNumber(totalCalls)}`);
  console.log(`성공률: ${successRate.toFixed(1)}% (${formatNumber(successfulCalls)}/${formatNumber(totalCalls)})`);
  console.log(`호출당 평균 비용: ${formatCurrency(averageCostPerCall)}`);
  console.log(`월별 예산 대비: ${((totalCost / MONTHLY_BUDGET) * 100).toFixed(1)}%`);
  console.log();

  console.log("=".repeat(60));
}

main().catch((error) => {
  console.error("스크립트 실행 실패:", error);
  process.exit(1);
});


