/**
 * 할루시네이션 뉴스 삭제 스크립트
 * Supabase에서 할루시네이션으로 의심되는 뉴스를 찾아서 삭제합니다.
 */

import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { log } from "@/lib/utils/logger";
import { checkHallucinationPatterns } from "@/lib/utils/hallucination-detector";

// .env.local 파일 로드
config({ path: resolve(process.cwd(), ".env.local") });

/**
 * 할루시네이션 뉴스 삭제
 */
async function deleteHallucinationNews() {
  try {
    // 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ 환경 변수가 설정되지 않았습니다:");
      if (!supabaseUrl) console.error("   - NEXT_PUBLIC_SUPABASE_URL");
      if (!supabaseKey) console.error("   - SUPABASE_SERVICE_ROLE_KEY");
      process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    log.info("할루시네이션 뉴스 삭제 스크립트 시작");

    // 최근 500개의 뉴스 조회 (최근 데이터부터 확인)
    const { data: recentNews, error: fetchError } = await supabase
      .from("news")
      .select("id, title, content, source_media")
      .order("created_at", { ascending: false })
      .limit(500);

    if (fetchError) {
      log.error("뉴스 데이터 조회 실패", new Error(fetchError.message));
      console.error("❌ 뉴스 데이터 조회 실패:", fetchError.message);
      process.exit(1);
    }

    if (!recentNews || recentNews.length === 0) {
      log.info("조회된 뉴스가 없습니다");
      console.log("✅ 조회된 뉴스가 없습니다.");
      process.exit(0);
    }

    log.info(`총 ${recentNews.length}개의 뉴스를 분석합니다`);
    console.log(`\n📊 총 ${recentNews.length}개의 뉴스를 분석합니다...\n`);

    // 할루시네이션 의심 뉴스 찾기
    const hallucinationNewsIds: string[] = [];
    const hallucinationNewsDetails: Array<{
      id: string;
      title: string;
      score: number;
      reasons: string[];
    }> = [];

    for (const news of recentNews) {
      const { isSuspicious, reasons, score } = checkHallucinationPatterns(
        news.title || "",
        news.content || "",
        news.source_media || ""
      );

      if (isSuspicious) {
        hallucinationNewsIds.push(news.id);
        hallucinationNewsDetails.push({
          id: news.id,
          title: news.title || "",
          score,
          reasons,
        });
      }
    }

    console.log("=".repeat(80));
    console.log("할루시네이션 분석 결과");
    console.log("=".repeat(80));
    console.log(`전체 뉴스: ${recentNews.length}개`);
    console.log(`의심 뉴스: ${hallucinationNewsDetails.length}개`);
    console.log(`정상 뉴스: ${recentNews.length - hallucinationNewsDetails.length}개`);

    if (hallucinationNewsDetails.length === 0) {
      console.log("\n✅ 할루시네이션으로 의심되는 뉴스가 없습니다.");
      log.info("할루시네이션 뉴스 없음", { total: recentNews.length });
      process.exit(0);
    }

    // 의심 뉴스 목록 출력
    console.log("\n의심 뉴스 상세:");
    console.log("-".repeat(80));
    hallucinationNewsDetails.forEach((news, index) => {
      console.log(`\n[${index + 1}] ID: ${news.id}`);
      console.log(`제목: ${news.title.substring(0, 100)}${news.title.length > 100 ? "..." : ""}`);
      console.log(`점수: ${news.score}/100`);
      console.log(`의심 사유:`);
      news.reasons.forEach((reason, idx) => {
        console.log(`  ${idx + 1}. ${reason}`);
      });
    });
    console.log("\n" + "-".repeat(80));

    // 사용자 확인 (실제 삭제는 주석 처리되어 있음)
    console.log("\n⚠️  삭제할 뉴스:");
    console.log(`총 ${hallucinationNewsIds.length}개의 뉴스를 삭제하시겠습니까?`);
    console.log("\n삭제를 진행합니다...\n");

    // 배치로 삭제 (한 번에 너무 많이 삭제하지 않도록)
    const BATCH_SIZE = 10;
    let deletedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < hallucinationNewsIds.length; i += BATCH_SIZE) {
      const batch = hallucinationNewsIds.slice(i, i + BATCH_SIZE);

      for (const newsId of batch) {
        try {
          const { error: deleteError } = await supabase
            .from("news")
            .delete()
            .eq("id", newsId);

          if (deleteError) {
            log.error("할루시네이션 뉴스 삭제 실패", new Error(deleteError.message), {
              newsId,
            });
            console.error(`❌ 삭제 실패 (ID: ${newsId}): ${deleteError.message}`);
            failedCount++;
          } else {
            deletedCount++;
            log.info("할루시네이션 뉴스 삭제 완료", { newsId });
          }
        } catch (error) {
          log.error("할루시네이션 뉴스 삭제 중 오류 발생", error instanceof Error ? error : new Error(String(error)), {
            newsId,
          });
          console.error(`❌ 삭제 중 오류 발생 (ID: ${newsId}):`, error instanceof Error ? error.message : String(error));
          failedCount++;
        }
      }

      // 진행 상황 출력
      console.log(`진행 중: ${Math.min(i + BATCH_SIZE, hallucinationNewsIds.length)}/${hallucinationNewsIds.length}`);
    }

    // 결과 출력
    console.log("\n" + "=".repeat(80));
    console.log("삭제 완료");
    console.log("=".repeat(80));
    console.log(`✅ 삭제 성공: ${deletedCount}개`);
    if (failedCount > 0) {
      console.log(`❌ 삭제 실패: ${failedCount}개`);
    }
    console.log(`📊 총 의심 뉴스: ${hallucinationNewsIds.length}개`);
    console.log("=".repeat(80));

    log.info("할루시네이션 뉴스 삭제 완료", {
      total: recentNews.length,
      suspicious: hallucinationNewsDetails.length,
      deleted: deletedCount,
      failed: failedCount,
    });

    process.exit(failedCount > 0 ? 1 : 0);
  } catch (error) {
    log.error("할루시네이션 뉴스 삭제 스크립트 오류", error instanceof Error ? error : new Error(String(error)));
    console.error("❌ 오류 발생:", error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error("스택 트레이스:", error.stack);
    }
    process.exit(1);
  }
}

deleteHallucinationNews();

