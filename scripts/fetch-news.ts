/**
 * GitHub Actions용 뉴스 수집 스크립트
 * fetchAndSaveNews 함수를 호출하여 뉴스를 수집하고 저장합니다.
 */

import { fetchAndSaveNews } from "../lib/news-fetcher";
import { log } from "../lib/utils/logger";

async function main() {
  try {
    const startTime = Date.now();
    log.info("뉴스 수집 스크립트 시작");

    const result = await fetchAndSaveNews();

    const executionTime = Date.now() - startTime;

    if (result.success > 0 || result.failed === 0) {
      log.info("뉴스 수집 성공", {
        success: result.success,
        failed: result.failed,
        total: result.total,
        executionTimeMs: executionTime,
        executionTimeSec: (executionTime / 1000).toFixed(2),
      });

      console.log(`✅ 성공: ${result.success}개`);
      console.log(`❌ 실패: ${result.failed}개`);
      console.log(`📊 전체: ${result.total}개`);
      console.log(`⏱️  실행 시간: ${(executionTime / 1000).toFixed(2)}초`);

      // 실패가 있으면 exit code 1 반환
      process.exit(result.failed > 0 ? 1 : 0);
    } else {
      log.error("뉴스 수집 실패", undefined, {
        success: result.success,
        failed: result.failed,
        total: result.total,
        executionTimeMs: executionTime,
      });

      console.error(`❌ 뉴스 수집 실패`);
      console.error(`성공: ${result.success}개`);
      console.error(`실패: ${result.failed}개`);
      console.error(`전체: ${result.total}개`);

      process.exit(1);
    }
  } catch (error) {
    log.error("뉴스 수집 스크립트 오류", error instanceof Error ? error : new Error(String(error)));
    console.error("❌ 오류 발생:", error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error("스택 트레이스:", error.stack);
    }
    process.exit(1);
  }
}

main();

