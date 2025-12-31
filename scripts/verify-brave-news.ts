/**
 * Brave News 수집 결과 검증 스크립트
 */

import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// 환경 변수 로드
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

async function verifyBraveNews() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Supabase 환경 변수가 설정되지 않았습니다.");
      process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 오늘 날짜
    const today = new Date().toISOString().split("T")[0];
    console.log(`\n📅 검증 날짜: ${today}\n`);

    // 최근 수집된 뉴스 조회
    const { data: recentNews, error } = await supabase
      .from("news")
      .select("id, title, category, source_media, published_date, image_url, content, news_category")
      .eq("published_date", today)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      console.error("❌ 데이터베이스 조회 오류:", error.message);
      process.exit(1);
    }

    if (!recentNews || recentNews.length === 0) {
      console.log("⚠️  오늘 수집된 뉴스가 없습니다.");
      process.exit(0);
    }

    // 카테고리별 통계
    const stats = {
      태국뉴스: { count: 0, withImage: 0, withCategory: 0 },
      관련뉴스: { count: 0, withImage: 0, withCategory: 0 },
      한국뉴스: { count: 0, withImage: 0, withCategory: 0 },
    };

    recentNews.forEach((news) => {
      const cat = news.category as keyof typeof stats;
      if (stats[cat]) {
        stats[cat].count++;
        if (news.image_url) stats[cat].withImage++;
        if (news.news_category) stats[cat].withCategory++;
      }
    });

    console.log("📊 수집 결과 통계:");
    console.log("=".repeat(50));
    for (const [category, stat] of Object.entries(stats)) {
      console.log(`\n${category}:`);
      console.log(`  총 개수: ${stat.count}개`);
      console.log(`  이미지 생성: ${stat.withImage}개 (${((stat.withImage / stat.count) * 100).toFixed(1)}%)`);
      console.log(`  주제 분류: ${stat.withCategory}개 (${((stat.withCategory / stat.count) * 100).toFixed(1)}%)`);
    }

    console.log(`\n${"=".repeat(50)}`);
    console.log(`\n총 수집 개수: ${recentNews.length}개`);
    console.log(`이미지 생성 완료: ${recentNews.filter((n) => n.image_url).length}개`);
    console.log(`주제 분류 완료: ${recentNews.filter((n) => n.news_category).length}개`);

    // 샘플 뉴스 출력
    console.log("\n📰 샘플 뉴스 (최근 5개):");
    console.log("=".repeat(50));
    recentNews.slice(0, 5).forEach((news, index) => {
      console.log(`\n${index + 1}. [${news.category}] ${news.title.substring(0, 60)}...`);
      console.log(`   출처: ${news.source_media}`);
      console.log(`   이미지: ${news.image_url ? "✅" : "❌"}`);
      console.log(`   주제: ${news.news_category || "미분류"}`);
      console.log(`   내용 길이: ${news.content?.length || 0}자`);
    });

    // 문제점 확인
    console.log("\n🔍 문제점 분석:");
    console.log("=".repeat(50));

    const issues: string[] = [];

    // 카테고리별 개수 확인
    for (const [category, stat] of Object.entries(stats)) {
      if (stat.count < 10) {
        issues.push(`⚠️  ${category}가 목표 개수(10개)보다 적습니다: ${stat.count}개`);
      }
      if (stat.withImage < stat.count) {
        issues.push(`⚠️  ${category}의 일부 뉴스에 이미지가 없습니다: ${stat.count - stat.withImage}개`);
      }
    }

    // 내용 길이 확인
    const shortContent = recentNews.filter((n) => (n.content?.length || 0) < 100);
    if (shortContent.length > 0) {
      issues.push(`⚠️  내용이 짧은 뉴스가 있습니다: ${shortContent.length}개`);
    }

    if (issues.length === 0) {
      console.log("✅ 문제점이 없습니다. 모든 뉴스가 정상적으로 수집되었습니다.");
    } else {
      issues.forEach((issue) => console.log(issue));
    }

    console.log("\n");
  } catch (error) {
    console.error("❌ 오류 발생:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

verifyBraveNews();

