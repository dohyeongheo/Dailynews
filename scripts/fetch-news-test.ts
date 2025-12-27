/**
 * GitHub Actions 테스트용 뉴스 수집 스크립트
 * 5개의 뉴스만 수집하고 이미지 생성까지 테스트합니다.
 */

import { fetchNewsFromGemini, saveNewsToDatabase } from "../lib/news-fetcher";
import { log } from "../lib/utils/logger";
import { getEnv } from "../lib/config/env";

async function main() {
  try {
    // 환경 변수 검증
    try {
      getEnv();
      log.info("환경 변수 검증 완료");
    } catch (envError) {
      log.error("환경 변수 검증 실패", envError instanceof Error ? envError : new Error(String(envError)));
      console.error("❌ 환경 변수 검증 실패:", envError instanceof Error ? envError.message : String(envError));
      process.exit(1);
    }

    const startTime = Date.now();
    log.info("뉴스 수집 테스트 스크립트 시작 (5개 제한)");

    // 뉴스 수집 (최대 5개)
    const newsItems = await fetchNewsFromGemini();

    // 5개로 제한
    const limitedNewsItems = newsItems.slice(0, 5);

    log.info("뉴스 수집 완료", {
      total: newsItems.length,
      limited: limitedNewsItems.length,
    });

    console.log(`📰 수집된 뉴스: ${newsItems.length}개`);
    console.log(`🔢 테스트용 제한: ${limitedNewsItems.length}개`);

    if (limitedNewsItems.length === 0) {
      console.error("❌ 수집된 뉴스가 없습니다.");
      process.exit(1);
    }

    // 뉴스 저장 및 이미지 생성
    const result = await saveNewsToDatabase(limitedNewsItems);

    const executionTime = Date.now() - startTime;
    const total = limitedNewsItems.length;
    const savedNewsIdsCount = result.savedNewsIds?.length || 0;

    if (result.success > 0) {
      log.info("뉴스 수집 및 이미지 생성 테스트 성공", {
        success: result.success,
        failed: result.failed,
        total,
        savedNewsIds: savedNewsIdsCount,
        executionTimeMs: executionTime,
        executionTimeSec: (executionTime / 1000).toFixed(2),
      });

      console.log(`\n✅ 테스트 완료!`);
      console.log(`✅ 성공: ${result.success}개`);
      console.log(`❌ 실패: ${result.failed}개`);
      console.log(`📊 전체: ${total}개`);
      console.log(`🖼️  저장된 뉴스 ID: ${savedNewsIdsCount}개`);
      console.log(`⏱️  실행 시간: ${(executionTime / 1000).toFixed(2)}초`);

      // 실패가 있으면 exit code 1 반환
      process.exit(result.failed > 0 ? 1 : 0);
    } else {
      log.error("뉴스 수집 테스트 실패", undefined, {
        success: result.success,
        failed: result.failed,
        total,
        executionTimeMs: executionTime,
      });

      console.error(`❌ 뉴스 수집 테스트 실패`);
      console.error(`성공: ${result.success}개`);
      console.error(`실패: ${result.failed}개`);
      console.error(`전체: ${total}개`);

      process.exit(1);
    }
  } catch (error) {
    log.error("뉴스 수집 테스트 스크립트 오류", error instanceof Error ? error : new Error(String(error)));
    console.error("❌ 오류 발생:", error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error("스택 트레이스:", error.stack);
    }
    process.exit(1);
  }
}

main();

