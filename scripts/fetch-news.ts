/**
 * GitHub Actions용 뉴스 수집 스크립트
 * fetchAndSaveNews 함수를 호출하여 뉴스를 수집하고 저장합니다.
 */

import { config } from "dotenv";
import { resolve } from "path";

// 환경 변수를 먼저 로드 (다른 모듈 import 전에)
// .env.local 파일 로드 (로컬 개발 환경용)
config({ path: resolve(process.cwd(), ".env.local") });
// .env 파일도 시도 (fallback)
config({ path: resolve(process.cwd(), ".env") });

async function main() {
  try {
    // 환경 변수 로드 후 모듈 import
    const { fetchAndSaveNews } = await import("../lib/news-fetcher");
    const { log } = await import("../lib/utils/logger");

    // 환경 변수 확인
    const { getEnv } = await import("../lib/config/env");
    try {
      getEnv();
    } catch (error) {
      console.error("❌ 환경 변수 검증 실패:");
      if (error instanceof Error) {
        console.error(error.message);
      }
      console.error("\n필수 환경 변수를 확인하세요:");
      console.error("   - GOOGLE_GEMINI_API_KEY");
      console.error("   - NEXT_PUBLIC_SUPABASE_URL");
      console.error("   - NEXT_PUBLIC_SUPABASE_ANON_KEY");
      console.error("   - SUPABASE_SERVICE_ROLE_KEY");
      console.error("\n.env.local 파일이 있는지 확인하세요.");
      process.exit(1);
    }

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

      // 사용자에게 보여줄 메시지는 console.log 유지 (GitHub Actions 로그 출력용)
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

      // 사용자에게 보여줄 메시지는 console.error 유지 (GitHub Actions 로그 출력용)
      console.error(`❌ 뉴스 수집 실패`);
      console.error(`성공: ${result.success}개`);
      console.error(`실패: ${result.failed}개`);
      console.error(`전체: ${result.total}개`);

      process.exit(1);
    }
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    log.error("뉴스 수집 스크립트 오류", errorObj);
    // 사용자에게 보여줄 메시지는 console.error 유지 (GitHub Actions 로그 출력용)
    console.error("❌ 오류 발생:", errorObj.message);
    if (errorObj.stack) {
      console.error("스택 트레이스:", errorObj.stack);
    }
    process.exit(1);
  }
}

main();

