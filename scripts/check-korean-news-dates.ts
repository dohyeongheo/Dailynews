/**
 * 한국 뉴스 날짜 확인 스크립트
 * 한국 뉴스(category = '한국뉴스')의 published_date를 확인하고,
 * 오늘 날짜(KST 기준)가 아닌 뉴스를 식별합니다.
 */

import { supabaseServer } from "../lib/supabase/server";
import { getTodayKST, isPastDate, isFutureDate } from "../lib/utils/date-helper";
import { log } from "../lib/utils/logger";

async function main() {
  try {
    // 환경 변수 확인
    const requiredEnvVars = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];

    const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
    if (missingVars.length > 0) {
      log.error("필수 환경 변수가 설정되지 않음", undefined, { missingVars });
      console.error("❌ 필수 환경 변수가 설정되지 않았습니다:");
      missingVars.forEach((varName) => console.error(`   - ${varName}`));
      process.exit(1);
    }

    const todayKST = getTodayKST();
    console.log(`\n📅 오늘 날짜 (KST): ${todayKST}\n`);

    // 한국 뉴스 조회 (최근 100개)
    const { data: koreanNews, error } = await supabaseServer
      .from("news")
      .select("id, title, published_date, category, created_at")
      .eq("category", "한국뉴스")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      log.error("한국 뉴스 조회 실패", new Error(error.message), { errorCode: error.code });
      console.error("❌ 한국 뉴스 조회에 실패했습니다:", error.message);
      process.exit(1);
    }

    if (!koreanNews || koreanNews.length === 0) {
      console.log("ℹ️  한국 뉴스가 없습니다.");
      process.exit(0);
    }

    console.log(`📊 전체 한국 뉴스 수: ${koreanNews.length}개\n`);

    // 날짜별 분류
    const todayNews: typeof koreanNews = [];
    const pastNews: typeof koreanNews = [];
    const futureNews: typeof koreanNews = [];
    const invalidDateNews: typeof koreanNews = [];

    for (const news of koreanNews) {
      const publishedDate = news.published_date;

      if (!publishedDate) {
        invalidDateNews.push(news);
        continue;
      }

      if (publishedDate === todayKST) {
        todayNews.push(news);
      } else if (isPastDate(publishedDate)) {
        pastNews.push(news);
      } else if (isFutureDate(publishedDate)) {
        futureNews.push(news);
      } else {
        invalidDateNews.push(news);
      }
    }

    // 결과 출력
    console.log("=" .repeat(60));
    console.log("📈 날짜별 분류 결과");
    console.log("=" .repeat(60));
    console.log(`✅ 오늘 날짜 (${todayKST}): ${todayNews.length}개`);
    console.log(`⏮️  과거 날짜: ${pastNews.length}개`);
    console.log(`⏭️  미래 날짜: ${futureNews.length}개`);
    console.log(`❓ 유효하지 않은 날짜: ${invalidDateNews.length}개`);
    console.log("=" .repeat(60));
    console.log();

    // 과거 날짜 뉴스 상세 출력
    if (pastNews.length > 0) {
      console.log("🔍 과거 날짜 뉴스 상세:");
      console.log("-".repeat(60));
      pastNews.slice(0, 20).forEach((news, index) => {
        console.log(`${index + 1}. [${news.published_date}] ${news.title.substring(0, 50)}...`);
        console.log(`   ID: ${news.id}, 수집일: ${news.created_at}`);
      });
      if (pastNews.length > 20) {
        console.log(`   ... 외 ${pastNews.length - 20}개 더 있음`);
      }
      console.log();
    }

    // 미래 날짜 뉴스 상세 출력
    if (futureNews.length > 0) {
      console.log("🔍 미래 날짜 뉴스 상세:");
      console.log("-".repeat(60));
      futureNews.slice(0, 20).forEach((news, index) => {
        console.log(`${index + 1}. [${news.published_date}] ${news.title.substring(0, 50)}...`);
        console.log(`   ID: ${news.id}, 수집일: ${news.created_at}`);
      });
      if (futureNews.length > 20) {
        console.log(`   ... 외 ${futureNews.length - 20}개 더 있음`);
      }
      console.log();
    }

    // 유효하지 않은 날짜 뉴스 상세 출력
    if (invalidDateNews.length > 0) {
      console.log("🔍 유효하지 않은 날짜 뉴스 상세:");
      console.log("-".repeat(60));
      invalidDateNews.slice(0, 20).forEach((news, index) => {
        console.log(`${index + 1}. [${news.published_date || "(없음)"}] ${news.title.substring(0, 50)}...`);
        console.log(`   ID: ${news.id}, 수집일: ${news.created_at}`);
      });
      if (invalidDateNews.length > 20) {
        console.log(`   ... 외 ${invalidDateNews.length - 20}개 더 있음`);
      }
      console.log();
    }

    // 날짜 분포 통계
    const dateDistribution: Record<string, number> = {};
    koreanNews.forEach((news) => {
      const date = news.published_date || "(없음)";
      dateDistribution[date] = (dateDistribution[date] || 0) + 1;
    });

    console.log("📊 날짜별 분포 (상위 10개):");
    console.log("-".repeat(60));
    const sortedDates = Object.entries(dateDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    sortedDates.forEach(([date, count]) => {
      const marker = date === todayKST ? "✅" : isPastDate(date) ? "⏮️ " : isFutureDate(date) ? "⏭️ " : "❓";
      console.log(`${marker} ${date}: ${count}개`);
    });
    console.log();

    // 요약
    const totalIssues = pastNews.length + futureNews.length + invalidDateNews.length;
    if (totalIssues > 0) {
      console.log(`⚠️  문제가 있는 뉴스: ${totalIssues}개 (전체의 ${((totalIssues / koreanNews.length) * 100).toFixed(1)}%)`);
      process.exit(1);
    } else {
      console.log("✅ 모든 한국 뉴스가 오늘 날짜입니다.");
      process.exit(0);
    }
  } catch (error) {
    log.error("스크립트 실행 중 오류 발생", error instanceof Error ? error : new Error(String(error)));
    console.error("❌ 오류가 발생했습니다:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();

