/**
 * GitHub Actions 테스트용 뉴스 수집 스크립트
 * 태국 뉴스만 5개 수집하고 이미지 생성까지 테스트합니다.
 * fetch-news.ts와 동일한 로직을 사용하되, 태국 뉴스만 5개로 제한합니다.
 * 뉴스 수집, 번역, 이미지 생성 로직은 fetch-news-daily와 동일하게 작동합니다.
 */

import { fetchAndSaveNews } from "../lib/news-fetcher";
import { log } from "../lib/utils/logger";

async function main() {
  try {
    // 환경 변수 확인 (fetch-news.ts와 동일한 방식)
    const requiredEnvVars = [
      "GOOGLE_GEMINI_API_KEY",
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ];

    const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
    if (missingVars.length > 0) {
      log.error("필수 환경 변수가 설정되지 않음", undefined, { missingVars });
      console.error("❌ 필수 환경 변수가 설정되지 않았습니다:");
      missingVars.forEach((varName) => console.error(`   - ${varName}`));
      console.error("\nGitHub Secrets에 다음 변수들을 설정하세요:");
      console.error("   - GOOGLE_GEMINI_API_KEY");
      console.error("   - NEXT_PUBLIC_SUPABASE_URL");
      console.error("   - NEXT_PUBLIC_SUPABASE_ANON_KEY");
      console.error("   - SUPABASE_SERVICE_ROLE_KEY");
      process.exit(1);
    }

    const startTime = Date.now();
    log.info("뉴스 수집 테스트 스크립트 시작 (태국 뉴스 5개 제한)");

    // fetch-news.ts와 동일한 fetchAndSaveNews 함수 사용
    // 태국 뉴스만 5개로 제한 (뉴스 수집, 번역, 이미지 생성 로직은 동일)
    const result = await fetchAndSaveNews(undefined, undefined, 5, "태국뉴스");

    const executionTime = Date.now() - startTime;

    // fetch-news.ts와 동일한 로직
    if (result.success > 0 || result.failed === 0) {
      log.info("뉴스 수집 테스트 성공", {
        success: result.success,
        failed: result.failed,
        total: result.total,
        executionTimeMs: executionTime,
        executionTimeSec: (executionTime / 1000).toFixed(2),
      });

      // 사용자에게 보여줄 메시지는 console.log 유지 (GitHub Actions 로그 출력용)
      console.log(`✅ 성공: ${result.success}개`);
      console.log(`❌ 실패: ${result.failed}개`);
      console.log(`📊 전체: ${result.total}개 (태국 뉴스 5개 제한)`);
      console.log(`⏱️  실행 시간: ${(executionTime / 1000).toFixed(2)}초`);

      // 실패가 있으면 exit code 1 반환
      process.exit(result.failed > 0 ? 1 : 0);
    } else {
      log.error("뉴스 수집 테스트 실패", undefined, {
        success: result.success,
        failed: result.failed,
        total: result.total,
        executionTimeMs: executionTime,
      });

      // 사용자에게 보여줄 메시지는 console.error 유지 (GitHub Actions 로그 출력용)
      console.error(`❌ 뉴스 수집 테스트 실패`);
      console.error(`성공: ${result.success}개`);
      console.error(`실패: ${result.failed}개`);
      console.error(`전체: ${result.total}개`);

      process.exit(1);
    }
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    log.error("뉴스 수집 테스트 스크립트 오류", errorObj);
    // 사용자에게 보여줄 메시지는 console.error 유지 (GitHub Actions 로그 출력용)
    console.error("❌ 오류 발생:", errorObj.message);
    if (errorObj.stack) {
      console.error("스택 트레이스:", errorObj.stack);
    }
    process.exit(1);
  }
}

main();
