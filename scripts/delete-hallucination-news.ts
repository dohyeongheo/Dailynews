/**
 * 할루시네이션 뉴스 삭제 스크립트
 * Supabase에서 할루시네이션으로 의심되는 뉴스를 찾아서 삭제합니다.
 * 모든 뉴스를 페이지네이션으로 조회하여 처리합니다.
 */

import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { log } from "@/lib/utils/logger";
import { checkHallucinationPatterns } from "@/lib/utils/hallucination-detector";

// .env.local 파일 로드
config({ path: resolve(process.cwd(), ".env.local") });

/**
 * 모든 뉴스를 페이지네이션으로 조회
 */
async function fetchAllNews(supabase: any): Promise<Array<{ id: string; title: string; content: string; source_media: string }>> {
  const allNews: Array<{ id: string; title: string; content: string; source_media: string }> = [];
  const PAGE_SIZE = 1000; // 한 번에 조회할 최대 개수
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("news")
      .select("id, title, content, source_media")
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      log.error("뉴스 데이터 조회 실패", new Error(error.message), { offset });
      throw new Error(`뉴스 데이터 조회 실패: ${error.message}`);
    }

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allNews.push(...data);
      offset += PAGE_SIZE;
      hasMore = data.length === PAGE_SIZE; // 다음 페이지가 있는지 확인
      console.log(`📊 조회 중: ${allNews.length}개...`);
    }
  }

  return allNews;
}

/**
 * 특정 키워드가 포함된 뉴스를 페이지네이션으로 조회
 */
async function fetchNewsByKeyword(
  supabase: any,
  keyword: string
): Promise<Array<{ id: string; title: string; content: string; source_media: string }>> {
  const allNews: Array<{ id: string; title: string; content: string; source_media: string }> = [];
  const PAGE_SIZE = 1000; // 한 번에 조회할 최대 개수
  let offset = 0;
  let hasMore = true;
  const searchTerm = `%${keyword}%`;

  while (hasMore) {
    const { data, error } = await supabase
      .from("news")
      .select("id, title, content, source_media")
      .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      log.error("키워드 뉴스 데이터 조회 실패", new Error(error.message), { offset, keyword });
      throw new Error(`키워드 뉴스 데이터 조회 실패: ${error.message}`);
    }

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allNews.push(...data);
      offset += PAGE_SIZE;
      hasMore = data.length === PAGE_SIZE; // 다음 페이지가 있는지 확인
      console.log(`📊 조회 중: ${allNews.length}개...`);
    }
  }

  return allNews;
}

/**
 * 특정 키워드가 포함된 할루시네이션 뉴스 삭제
 */
async function deleteHallucinationNewsByKeyword(keyword: string) {
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

    log.info("키워드 기반 할루시네이션 뉴스 삭제 스크립트 시작", { keyword });

    // 키워드가 포함된 뉴스 조회 (페이지네이션)
    console.log(`\n📊 "${keyword}" 키워드가 포함된 뉴스를 조회합니다...`);
    const keywordNews = await fetchNewsByKeyword(supabase, keyword);

    if (!keywordNews || keywordNews.length === 0) {
      log.info("키워드로 조회된 뉴스가 없습니다", { keyword });
      console.log(`✅ "${keyword}" 키워드가 포함된 뉴스가 없습니다.`);
      process.exit(0);
    }

    log.info(`총 ${keywordNews.length}개의 키워드 뉴스를 분석합니다`, { keyword });
    console.log(`\n📊 "${keyword}" 키워드가 포함된 뉴스: ${keywordNews.length}개`);
    console.log(`할루시네이션 패턴을 검사합니다...\n`);

    // 할루시네이션 의심 뉴스 찾기
    const hallucinationNewsIds: string[] = [];
    const hallucinationNewsDetails: Array<{
      id: string;
      title: string;
      score: number;
      reasons: string[];
    }> = [];

    for (const news of keywordNews) {
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
    console.log(`"${keyword}" 키워드 할루시네이션 분석 결과`);
    console.log("=".repeat(80));
    console.log(`키워드 포함 뉴스: ${keywordNews.length}개`);
    console.log(`의심 뉴스: ${hallucinationNewsDetails.length}개`);
    console.log(`정상 뉴스: ${keywordNews.length - hallucinationNewsDetails.length}개`);

    if (hallucinationNewsDetails.length === 0) {
      console.log(`\n✅ "${keyword}" 키워드가 포함된 할루시네이션 의심 뉴스가 없습니다.`);
      log.info("할루시네이션 뉴스 없음", { keyword, total: keywordNews.length });
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

    // 삭제 진행
    console.log(`\n⚠️  삭제할 뉴스:`);
    console.log(`총 ${hallucinationNewsIds.length}개의 뉴스를 삭제합니다...\n`);

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
              keyword,
            });
            console.error(`❌ 삭제 실패 (ID: ${newsId}): ${deleteError.message}`);
            failedCount++;
          } else {
            deletedCount++;
            log.info("할루시네이션 뉴스 삭제 완료", { newsId, keyword });
          }
        } catch (error) {
          log.error("할루시네이션 뉴스 삭제 중 오류 발생", error instanceof Error ? error : new Error(String(error)), {
            newsId,
            keyword,
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
    console.log(`📊 키워드 "${keyword}" 포함 뉴스: ${keywordNews.length}개`);
    console.log(`📊 총 의심 뉴스: ${hallucinationNewsIds.length}개`);
    console.log("=".repeat(80));

    log.info("키워드 기반 할루시네이션 뉴스 삭제 완료", {
      keyword,
      total: keywordNews.length,
      suspicious: hallucinationNewsDetails.length,
      deleted: deletedCount,
      failed: failedCount,
    });

    process.exit(failedCount > 0 ? 1 : 0);
  } catch (error) {
    log.error("키워드 기반 할루시네이션 뉴스 삭제 스크립트 오류", error instanceof Error ? error : new Error(String(error)));
    console.error("❌ 오류 발생:", error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error("스택 트레이스:", error.stack);
    }
    process.exit(1);
  }
}

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

    // 모든 뉴스 조회 (페이지네이션)
    console.log("\n📊 모든 뉴스를 조회합니다...");
    const recentNews = await fetchAllNews(supabase);

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

// 명령줄 인자로 키워드가 제공되면 키워드 기반 삭제, 아니면 전체 삭제
const keyword = process.argv[2];

if (keyword) {
  deleteHallucinationNewsByKeyword(keyword);
} else {
  deleteHallucinationNews();
}

